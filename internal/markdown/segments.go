package markdown

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"

	"github.com/templui/templui/v2/internal/ui/modules"
	"github.com/yuin/goldmark/parser"
	"go.abhg.dev/goldmark/frontmatter"
)

// Segment is one slice of a component doc page: either rendered markdown
// HTML or a shortcode (ComponentPreview, ComponentSource, CodeTabs, ...)
// the page template resolves.
type Segment struct {
	HTML      string
	Shortcode string
	Attrs     map[string]string
	// Tabs carries the parsed CodeTabs structure.
	Tabs []SegmentTab
	// Children carries the inner segments of wrapping shortcodes
	// (CodeCollapsibleWrapper).
	Children []Segment
	// ID is a page unique id for shortcodes that need one (CodeTabs).
	ID string
}

// SegmentTab is one tab of a CodeTabs block with its own segments.
type SegmentTab struct {
	Value    string
	Label    string
	Segments []Segment
}

// Shortcode tags mirror shadcn's mdx components, so their docs sources can
// be adopted nearly verbatim. Callout, CodeTabs and CodeCollapsibleWrapper
// carry inner markdown, Steps wraps the segments between its tags and Step
// is a numbered heading; the others are self closing.
var shortcodeRe = regexp.MustCompile(`(?ms)^(?:<(ComponentPreview|ComponentSource)\b(.*?)/>|<(Callout)\b([^>\n]*)>(.*?)</Callout>|<(Steps)([^>\n]*)>|(</Steps>)|<(Step)>(.*?)</Step>|<(CodeTabs)>(.*?)</CodeTabs>|<(CodeCollapsibleWrapper)>(.*?)</CodeCollapsibleWrapper>)\s*$`)

var (
	tabsTriggerRe = regexp.MustCompile(`(?s)<TabsTrigger value="([^"]+)">\s*(.*?)\s*</TabsTrigger>`)
	tabsContentRe = regexp.MustCompile(`(?s)<TabsContent value="([^"]+)">\n(.*?)\n</TabsContent>`)
)

// attrRe matches key="value" pairs and bare boolean attributes (hideCode).
var attrRe = regexp.MustCompile(`([a-zA-Z-]+)(?:="([^"]*)")?`)

func parseAttrs(raw string) map[string]string {
	attrs := map[string]string{}
	for _, m := range attrRe.FindAllStringSubmatch(raw, -1) {
		attrs[m[1]] = m[2]
	}
	return attrs
}

// ParseSegments splits a component doc source into markdown/shortcode
// segments and returns them with the frontmatter and table of contents.
func (p *Parser) ParseSegments(source []byte) ([]Segment, map[string]any, []modules.TableOfContentsItem, error) {
	// Frontmatter is parsed from the full source; the shortcode-free source
	// also feeds the table of contents.
	meta := map[string]any{}
	{
		context := parser.NewContext()
		var buf bytes.Buffer
		if err := p.md.Convert(source, &buf, parser.WithContext(context)); err != nil {
			return nil, nil, nil, err
		}
		if data := frontmatter.Get(context); data != nil {
			_ = data.Decode(&meta)
		}
	}
	toc := p.ExtractTableOfContents(shortcodeRe.ReplaceAll(source, nil))

	// One shared context so goldmark's auto heading ids deduplicate across
	// the chunk conversions exactly like in the TOC's single pass (three
	// "Fieldset" headings become fieldset, fieldset-1, fieldset-2).
	idContext := parser.NewContext()
	counter := 0
	segments, err := p.parseChunks(stripFrontmatter(source), idContext, &counter)
	if err != nil {
		return nil, nil, nil, err
	}
	return segments, meta, toc, nil
}

// parseChunks splits a source slice into markdown and shortcode segments.
// CodeTabs bodies recurse through the same function.
func (p *Parser) parseChunks(source []byte, idContext parser.Context, counter *int) ([]Segment, error) {
	var segments []Segment
	flush := func(chunk []byte) error {
		if len(bytes.TrimSpace(chunk)) == 0 {
			return nil
		}
		var buf bytes.Buffer
		if err := p.md.Convert(chunk, &buf, parser.WithContext(idContext)); err != nil {
			return err
		}
		segments = append(segments, Segment{HTML: buf.String()})
		return nil
	}
	last := 0
	for _, m := range shortcodeRe.FindAllSubmatchIndex(source, -1) {
		if err := flush(source[last:m[0]]); err != nil {
			return nil, err
		}
		switch {
		case m[6] != -1: // Callout with attrs and inner markdown
			var buf bytes.Buffer
			if err := p.md.Convert(source[m[10]:m[11]], &buf, parser.WithContext(idContext)); err != nil {
				return nil, err
			}
			segments = append(segments, Segment{Shortcode: "Callout", Attrs: parseAttrs(string(source[m[8]:m[9]])), HTML: buf.String()})
		case m[12] != -1: // Steps opening tag
			segments = append(segments, Segment{Shortcode: "Steps", Attrs: parseAttrs(string(source[m[14]:m[15]]))})
		case m[16] != -1: // Steps closing tag
			segments = append(segments, Segment{Shortcode: "StepsEnd"})
		case m[18] != -1: // Step heading with inline markdown
			var buf bytes.Buffer
			if err := p.md.Convert(source[m[20]:m[21]], &buf, parser.WithContext(idContext)); err != nil {
				return nil, err
			}
			title := strings.TrimSpace(buf.String())
			title = strings.TrimSuffix(strings.TrimPrefix(title, "<p>"), "</p>")
			segments = append(segments, Segment{Shortcode: "Step", HTML: title})
		case m[22] != -1: // CodeTabs with nested tab contents
			seg, err := p.parseCodeTabs(source[m[24]:m[25]], idContext, counter)
			if err != nil {
				return nil, err
			}
			segments = append(segments, seg)
		case m[26] != -1: // CodeCollapsibleWrapper with inner markdown
			children, err := p.parseChunks(source[m[28]:m[29]], idContext, counter)
			if err != nil {
				return nil, err
			}
			segments = append(segments, Segment{Shortcode: "CodeCollapsibleWrapper", Children: children})
		default:
			segments = append(segments, Segment{
				Shortcode: string(source[m[2]:m[3]]),
				Attrs:     parseAttrs(string(source[m[4]:m[5]])),
			})
		}
		last = m[1]
	}
	if err := flush(source[last:]); err != nil {
		return nil, err
	}
	return segments, nil
}

// parseCodeTabs parses the body of a CodeTabs block: the trigger labels
// from TabsList and one recursive segment list per TabsContent.
func (p *Parser) parseCodeTabs(body []byte, idContext parser.Context, counter *int) (Segment, error) {
	labels := map[string]string{}
	for _, m := range tabsTriggerRe.FindAllSubmatch(body, -1) {
		labels[string(m[1])] = string(m[2])
	}
	var tabs []SegmentTab
	for _, m := range tabsContentRe.FindAllSubmatch(body, -1) {
		value := string(m[1])
		segs, err := p.parseChunks(m[2], idContext, counter)
		if err != nil {
			return Segment{}, err
		}
		label := labels[value]
		if label == "" {
			label = value
		}
		tabs = append(tabs, SegmentTab{Value: value, Label: label, Segments: segs})
	}
	*counter++
	return Segment{Shortcode: "CodeTabs", Tabs: tabs, ID: fmt.Sprintf("codetabs-%d", *counter)}, nil
}

var frontmatterRe = regexp.MustCompile(`(?s)\A---\n.*?\n---\n`)

func stripFrontmatter(source []byte) []byte {
	return frontmatterRe.ReplaceAll(source, nil)
}

// ExpandPreviewShortcodes replaces <ComponentPreview name="X"/> tags with the
// demo source as a fenced code block — the shadcn behavior for the exported
// .md view (the authored source keeps the tags).
func ExpandPreviewShortcodes(source []byte, resolve func(name string) ([]byte, bool)) []byte {
	return shortcodeRe.ReplaceAllFunc(source, func(match []byte) []byte {
		m := shortcodeRe.FindSubmatch(match)
		if string(m[1]) != "ComponentPreview" {
			return match
		}
		name := parseAttrs(string(m[2]))["name"]
		code, ok := resolve(name)
		if !ok {
			return match
		}
		return []byte("```templ\n" + string(bytes.TrimRight(code, "\n")) + "\n```\n")
	})
}
