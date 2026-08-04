// 1:1 pendant of shadcn packages/shadcn/src/styles/transform.ts plus the
// transformer pipeline of packages/shadcn/src/utils/transformers/index.ts:
// parse the source once (the Project.createSourceFile pendant), run the
// transformers over it, return the text.
//
// shadcn splits the work in two places: the registry build runs transformStyle
// (= transformStyleMap) per style, and the CLI install pipeline later resolves
// the allowlisted markers (transformRtl, transformMenu, transformCleanup,
// transformFont). templui has no separate install step, so TransformStyle
// composes both into one pass and Options carries what shadcn reads from the
// project config (config.rtl, config.menuColor default, --font-heading
// support).
package inliner

import (
	"fmt"
	"strings"
)

// Options is the config pendant for the marker transformers.
type Options struct {
	// RTL replaces the cn-rtl-flip marker with rtl:rotate-180 instead of
	// stripping it (transform-rtl.ts RTL_FLIP_MARKER, config.rtl).
	RTL bool
	// FontHeading replaces the cn-font-heading marker with the font-heading
	// utility instead of stripping it. transform-font.ts does this only when
	// the target project's Tailwind CSS defines --font-heading; default is
	// the strip.
	FontHeading bool
}

// transformerStyle is the TransformerStyle pendant.
type transformerStyle func(sourceFile *sourceFile, styleMap StyleMap, opts Options)

// transformers is the default pipeline, in shadcn's order: the registry
// build's transformStyleMap first, then the CLI install transformers
// (transformRtl before transformCleanup like in transformers/index.ts, and
// transformCleanup before transformFont because cleanup leaves the font
// markers alone "until transformFont runs").
var transformers = []transformerStyle{
	transformStyleMap,
	transformRtl,
	transformMenu,
	transformCleanup,
	transformFont,
}

// TransformStyle ports transformStyle: expand the cn-* classes of a .templ
// source into the flat Tailwind utilities of the given style map and resolve
// the marker classes, producing distribution-ready code with no cn-*
// dependency.
func TransformStyle(source string, styleMap StyleMap, opts Options) (string, error) {
	sourceFile, err := parseSourceFile(source)
	if err != nil {
		return "", err
	}

	for _, transformer := range transformers {
		transformer(sourceFile, styleMap, opts)
	}

	return sourceFile.getText(), nil
}

// MARK: ts-morph SourceFile pendant

// templ sources are Go plus markup, so instead of a tsx AST the source is
// lexed into segments once; the transformers then walk the string literals
// (forEachStringLiteral is the forEachDescendant/StringLiteral pendant).
// templ's HTML attribute values are lexically identical to double-quoted Go
// strings, so class="cn-x ..." is walked exactly like a Go literal.
type segmentKind int

const (
	segmentCode          segmentKind = iota
	segmentStringLiteral             // double-quoted or raw backtick literal, text without quotes
	segmentComment                   // line or block comment, text with markers
)

type segment struct {
	kind  segmentKind
	quote byte // '"' or '`' for string literals
	text  string
}

type sourceFile struct {
	segments []segment
}

func (f *sourceFile) getText() string {
	var b strings.Builder
	for _, s := range f.segments {
		if s.kind == segmentStringLiteral {
			b.WriteByte(s.quote)
			b.WriteString(s.text)
			b.WriteByte(s.quote)
			continue
		}
		b.WriteString(s.text)
	}
	return b.String()
}

// forEachStringLiteral rewrites every string literal value through fn.
func (f *sourceFile) forEachStringLiteral(fn func(value string) string) {
	for i := range f.segments {
		if f.segments[i].kind == segmentStringLiteral {
			f.segments[i].text = fn(f.segments[i].text)
		}
	}
}

// forEachComment rewrites every comment (markers included) through fn.
func (f *sourceFile) forEachComment(fn func(comment string) string) {
	for i := range f.segments {
		if f.segments[i].kind == segmentComment {
			f.segments[i].text = fn(f.segments[i].text)
		}
	}
}

func parseSourceFile(source string) (*sourceFile, error) {
	f := &sourceFile{}
	var code strings.Builder
	flushCode := func() {
		if code.Len() > 0 {
			f.segments = append(f.segments, segment{kind: segmentCode, text: code.String()})
			code.Reset()
		}
	}

	i := 0
	for i < len(source) {
		c := source[i]
		switch {
		case strings.HasPrefix(source[i:], "//"):
			end := strings.IndexByte(source[i:], '\n')
			if end < 0 {
				end = len(source) - i
			}
			flushCode()
			f.segments = append(f.segments, segment{kind: segmentComment, text: source[i : i+end]})
			i += end
		case strings.HasPrefix(source[i:], "/*"):
			end := strings.Index(source[i+2:], "*/")
			if end < 0 {
				return nil, fmt.Errorf("inliner: unterminated block comment at offset %d", i)
			}
			flushCode()
			f.segments = append(f.segments, segment{kind: segmentComment, text: source[i : i+2+end+2]})
			i += 2 + end + 2
		case c == '"':
			end, err := scanDoubleQuoted(source, i)
			if err != nil {
				return nil, err
			}
			flushCode()
			f.segments = append(f.segments, segment{kind: segmentStringLiteral, quote: '"', text: source[i+1 : end]})
			i = end + 1
		case c == '`':
			end := strings.IndexByte(source[i+1:], '`')
			if end < 0 {
				return nil, fmt.Errorf("inliner: unterminated raw string at offset %d", i)
			}
			end = i + 1 + end
			flushCode()
			f.segments = append(f.segments, segment{kind: segmentStringLiteral, quote: '`', text: source[i+1 : end]})
			i = end + 1
		case c == '\'':
			// Rune literal, or a plain apostrophe in templ markup text; only
			// skip it as a literal when a nearby closing quote exists.
			if end, ok := scanRuneLiteral(source, i); ok {
				code.WriteString(source[i : end+1])
				i = end + 1
			} else {
				code.WriteByte(c)
				i++
			}
		default:
			code.WriteByte(c)
			i++
		}
	}
	flushCode()
	return f, nil
}

func scanDoubleQuoted(source string, start int) (int, error) {
	for i := start + 1; i < len(source); i++ {
		switch source[i] {
		case '\\':
			i++
		case '"':
			return i, nil
		case '\n':
			return 0, fmt.Errorf("inliner: unterminated string literal at offset %d", start)
		}
	}
	return 0, fmt.Errorf("inliner: unterminated string literal at offset %d", start)
}

// scanRuneLiteral reports the closing quote of a Go rune literal starting at
// start, if one plausibly exists ('a', '\n', 'ሴ', ...).
func scanRuneLiteral(source string, start int) (int, bool) {
	const maxRuneLen = 12 // '\U0001F600'
	for i := start + 1; i < len(source) && i <= start+maxRuneLen; i++ {
		switch source[i] {
		case '\\':
			i++
		case '\'':
			if i == start+1 {
				return 0, false // empty '' is not a rune literal
			}
			return i, true
		case '\n':
			return 0, false
		}
	}
	return 0, false
}
