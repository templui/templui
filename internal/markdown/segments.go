package markdown

import (
	"bytes"
	"regexp"

	"github.com/templui/templui/internal/ui/modules"
	"github.com/yuin/goldmark/parser"
	"go.abhg.dev/goldmark/frontmatter"
)

// Segment is one slice of a component doc page: either rendered markdown
// HTML or a shortcode (ComponentPreview, ComponentSource, Installation) the
// page template resolves against the showcase registry.
type Segment struct {
	HTML      string
	Shortcode string
	Attrs     map[string]string
}

// Shortcode tags mirror shadcn's mdx components, so their docs sources can
// be adopted nearly verbatim.
var shortcodeRe = regexp.MustCompile(`(?ms)^<(ComponentPreview|ComponentSource|Installation)\b(.*?)/>\s*$`)

var attrRe = regexp.MustCompile(`([a-zA-Z-]+)="([^"]*)"`)

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

	var segments []Segment
	last := 0
	matches := shortcodeRe.FindAllSubmatchIndex(source, -1)
	flush := func(chunk []byte) error {
		if len(bytes.TrimSpace(chunk)) == 0 {
			return nil
		}
		var buf bytes.Buffer
		if err := p.md.Convert(chunk, &buf); err != nil {
			return err
		}
		segments = append(segments, Segment{HTML: buf.String()})
		return nil
	}
	for i, m := range matches {
		chunk := source[last:m[0]]
		// Frontmatter only parses at the very start; strip it from the first
		// chunk manually so it never renders as a table/thematic break.
		if i == 0 {
			chunk = stripFrontmatter(chunk)
		}
		if err := flush(chunk); err != nil {
			return nil, nil, nil, err
		}
		segments = append(segments, Segment{
			Shortcode: string(source[m[2]:m[3]]),
			Attrs:     parseAttrs(string(source[m[4]:m[5]])),
		})
		last = m[1]
	}
	tail := source[last:]
	if len(matches) == 0 {
		tail = stripFrontmatter(tail)
	}
	if err := flush(tail); err != nil {
		return nil, nil, nil, err
	}
	return segments, meta, toc, nil
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
