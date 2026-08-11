package markdown

import (
	"io"

	"github.com/yuin/goldmark/parser"
	"go.abhg.dev/goldmark/frontmatter"
)

// Frontmatter decodes only the leading frontmatter block. The components index
// needs the title and description of every component doc, and running sixty
// full pages through the renderer (shiki highlighting included) to read two
// strings each would be wasteful, so the block goes through goldmark alone and
// the body is never touched.
func (p *Parser) Frontmatter(source []byte) map[string]any {
	meta := map[string]any{}
	block := frontmatterRe.Find(source)
	if block == nil {
		return meta
	}
	context := parser.NewContext()
	if err := p.md.Convert(block, io.Discard, parser.WithContext(context)); err != nil {
		return meta
	}
	data := frontmatter.Get(context)
	if data == nil {
		return meta
	}
	if err := data.Decode(&meta); err != nil {
		return map[string]any{}
	}
	return meta
}
