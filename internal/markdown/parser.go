package markdown

import (
	"bytes"
	"context"
	"fmt"

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
			goldmarkhtml.WithHardWraps(),
			goldmarkhtml.WithXHTML(),
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
	language := string(n.Language(source))
	if language == "" {
		language = "text"
	}

	// Extract code content
	var code bytes.Buffer
	lines := n.Lines()
	for i := 0; i < lines.Len(); i++ {
		line := lines.At(i)
		code.Write(line.Value(source))
	}

	// Get Shiki highlighted HTML with background context
	highlightedHTML := modules.GetHighlightedHTML(context.Background(), code.String(), language)

	// Wrap with same structure as modules.Code
	_, err := w.WriteString(fmt.Sprintf(`<div class="relative code-highlighting-container" data-code-block=""><div class="[&_pre]:block [&_pre]:overflow-x-auto [&_pre]:overflow-y-auto [&_pre]:max-h-96 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:text-sm">%s</div></div>`, highlightedHTML))
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

	// Get Shiki highlighted HTML with default language
	highlightedHTML := modules.GetHighlightedHTML(context.Background(), code.String(), "text")

	// Wrap with same structure as modules.Code
	_, err := w.WriteString(fmt.Sprintf(`<div class="relative code-highlighting-container" data-code-block=""><div class="[&_pre]:block [&_pre]:overflow-x-auto [&_pre]:overflow-y-auto [&_pre]:max-h-96 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:text-sm">%s</div></div>`, highlightedHTML))
	return ast.WalkContinue, err
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
