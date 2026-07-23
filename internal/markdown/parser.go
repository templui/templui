package markdown

import (
	"strconv"
	"bytes"
	"context"
	"regexp"
	"strings"

	"github.com/a-h/templ"

	"github.com/templui/templui/internal/ui/modules"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer"
	goldmarkhtml "github.com/yuin/goldmark/renderer/html"
	east "github.com/yuin/goldmark/extension/ast"
	"github.com/yuin/goldmark/text"
	"github.com/yuin/goldmark/util"
	"go.abhg.dev/goldmark/frontmatter"
)

type Parser struct {
	md goldmark.Markdown
}

func NewParser() *Parser {
	// Custom code block renderer will get context per-request
	codeBlockRenderer := &ShikiCodeBlockRenderer{}

	md := goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			extension.Footnote,
			extension.Typographer,
			&frontmatter.Extender{},
		),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(),
		),
		goldmark.WithRendererOptions(
			goldmarkhtml.WithXHTML(),
			// The docs markdown is repo-authored, raw HTML (e.g. docs images)
			// renders as written.
			goldmarkhtml.WithUnsafe(),
			// Add custom code block renderer
			renderer.WithNodeRenderers(
				util.Prioritized(codeBlockRenderer, 100),
				util.Prioritized(&TableScrollRenderer{}, 100),
			),
		),
	)

	return &Parser{
		md: md,
	}
}

func (p *Parser) Parse(source []byte) ([]byte, error) {
	var buf bytes.Buffer
	err := p.md.Convert(source, &buf)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (p *Parser) ParseWithFrontmatter(source []byte) (content []byte, meta map[string]any, err error) {
	context := parser.NewContext()
	var buf bytes.Buffer

	err = p.md.Convert(source, &buf, parser.WithContext(context))
	if err != nil {
		return nil, nil, err
	}

	data := frontmatter.Get(context)
	if data == nil {
		meta = make(map[string]any)
	} else {
		err = data.Decode(&meta)
		if err != nil {
			meta = make(map[string]any)
		}
	}

	return buf.Bytes(), meta, nil
}

// ShikiCodeBlockRenderer renders code blocks with Shiki highlighting
type ShikiCodeBlockRenderer struct{}

func (r *ShikiCodeBlockRenderer) RegisterFuncs(reg renderer.NodeRendererFuncRegisterer) {
	reg.Register(ast.KindFencedCodeBlock, r.renderFencedCodeBlock)
	reg.Register(ast.KindCodeBlock, r.renderCodeBlock)
}

func (r *ShikiCodeBlockRenderer) renderFencedCodeBlock(w util.BufWriter, source []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
	if !entering {
		return ast.WalkContinue, nil
	}

	n := node.(*ast.FencedCodeBlock)

	// The full fence info line carries shadcn's rehype-pretty-code meta:
	// ```css showLineNumbers title="globals.css"
	info := ""
	if n.Info != nil {
		info = string(n.Info.Segment.Value(source))
	}
	language := "text"
	if fields := strings.Fields(info); len(fields) > 0 {
		language = fields[0]
	}
	title := ""
	if m := fenceTitleRe.FindStringSubmatch(info); m != nil {
		title = m[1]
	}
	var highlightLines []int
	if m := fenceLinesRe.FindStringSubmatch(info); m != nil {
		for _, part := range strings.Split(m[1], ",") {
			if from, to, ok := strings.Cut(part, "-"); ok {
				a, _ := strconv.Atoi(from)
				b, _ := strconv.Atoi(to)
				for i := a; i <= b; i++ {
					highlightLines = append(highlightLines, i)
				}
			} else if n, err := strconv.Atoi(part); err == nil {
				highlightLines = append(highlightLines, n)
			}
		}
	}
	var highlightWords []string
	for _, m := range fenceWordsRe.FindAllStringSubmatch(fenceTitleRe.ReplaceAllString(info, ""), -1) {
		highlightWords = append(highlightWords, m[1])
	}

	// Extract code content
	var code bytes.Buffer
	lines := n.Lines()
	for i := 0; i < lines.Len(); i++ {
		line := lines.At(i)
		code.Write(line.Value(source))
	}

	return writeCodeFigure(w, modules.CodeFigureProps{
		Language:        language,
		Title:           title,
		ShowLineNumbers: strings.Contains(info, "showLineNumbers"),
		Code:            strings.TrimSuffix(code.String(), "\n"),
		HighlightLines:  highlightLines,
		HighlightWords:  highlightWords,
	})
}

var (
	fenceTitleRe = regexp.MustCompile(`title="([^"]*)"`)
	fenceLinesRe = regexp.MustCompile(`\{([\d,-]+)\}`)
	fenceWordsRe = regexp.MustCompile(`/([^/]+)/`)
)

func writeCodeFigure(w util.BufWriter, props modules.CodeFigureProps) (ast.WalkStatus, error) {
	html, err := templ.ToGoHTML(context.Background(), modules.CodeFigure(props))
	if err != nil {
		return ast.WalkStop, err
	}
	_, err = w.WriteString(string(html))
	return ast.WalkContinue, err
}

func (r *ShikiCodeBlockRenderer) renderCodeBlock(w util.BufWriter, source []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
	if !entering {
		return ast.WalkContinue, nil
	}

	n := node.(*ast.CodeBlock)

	// Extract code content
	var code bytes.Buffer
	lines := n.Lines()
	for i := 0; i < lines.Len(); i++ {
		line := lines.At(i)
		code.Write(line.Value(source))
	}

	return writeCodeFigure(w, modules.CodeFigureProps{
		Language: "text",
		Code:     strings.TrimSuffix(code.String(), "\n"),
	})
}

// Internal type for tracking heading levels during TOC extraction
type tocItem struct {
	ID    string
	Text  string
	Level int
}

// ExtractTableOfContents extracts headings from markdown to build a TOC
func (p *Parser) ExtractTableOfContents(source []byte) []modules.TableOfContentsItem {
	doc := p.md.Parser().Parse(text.NewReader(source))
	var items []tocItem

	ast.Walk(doc, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}

		if heading, ok := n.(*ast.Heading); ok {
			// Only extract h2 and h3 for TOC
			if heading.Level < 2 || heading.Level > 3 {
				return ast.WalkContinue, nil
			}

			// Extract heading text - walk all children to get full text
			var textBuf bytes.Buffer
			for child := heading.FirstChild(); child != nil; child = child.NextSibling() {
				if textNode, ok := child.(*ast.Text); ok {
					textBuf.Write(textNode.Segment.Value(source))
				}
			}
			text := textBuf.String()

			// Get heading ID from Goldmark's AutoHeadingID
			id := ""
			if idAttr, ok := heading.Attribute([]byte("id")); ok {
				id = string(idAttr.([]byte))
			}

			if text != "" && id != "" {
				items = append(items, tocItem{
					ID:    id,
					Text:  text,
					Level: heading.Level,
				})
			}
		}

		return ast.WalkContinue, nil
	})

	// Build hierarchical structure (h2 as parent, h3 as children)
	return buildTOCHierarchy(items)
}

func buildTOCHierarchy(items []tocItem) []modules.TableOfContentsItem {
	if len(items) == 0 {
		return nil
	}

	var result []modules.TableOfContentsItem
	var currentH2 *modules.TableOfContentsItem

	for _, item := range items {
		if item.Level == 2 {
			// New h2 - add previous h2 if exists, start new one
			if currentH2 != nil {
				result = append(result, *currentH2)
			}
			currentH2 = &modules.TableOfContentsItem{
				ID:       item.ID,
				Text:     item.Text,
				Children: []modules.TableOfContentsItem{},
			}
		} else if item.Level == 3 && currentH2 != nil {
			// h3 - add as child to current h2
			currentH2.Children = append(currentH2.Children, modules.TableOfContentsItem{
				ID:   item.ID,
				Text: item.Text,
			})
		}
	}

	// Don't forget the last h2
	if currentH2 != nil {
		result = append(result, *currentH2)
	}

	return result
}

// TableScrollRenderer wraps GFM tables in the typeset scroll container so
// wide tables scroll horizontally, like shadcn's mdx table component.
type TableScrollRenderer struct{}

func (r *TableScrollRenderer) RegisterFuncs(reg renderer.NodeRendererFuncRegisterer) {
	reg.Register(east.KindTable, r.renderTable)
}

func (r *TableScrollRenderer) renderTable(w util.BufWriter, source []byte, node ast.Node, entering bool) (ast.WalkStatus, error) {
	if entering {
		_, _ = w.WriteString(`<div class="typeset-scroll scrollbar-none"><table>`)
	} else {
		_, _ = w.WriteString("</table></div>")
	}
	return ast.WalkContinue, nil
}
