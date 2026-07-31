// HTML pass of the inliner: the docs previews render components with their
// canonical cn-* classes; InlineHTML rewrites the rendered markup's class
// attributes through the same transformer pipeline TransformStyle runs over
// .templ sources, so a preview shows the compiled utility build of its style
// exactly like shadcn's docs render the per-style compiled registry output.
package inliner

import (
	"html"
	"regexp"
	"strings"
)

// classAttrRe matches templ-rendered class attributes. The markup is machine
// generated (templ always emits double-quoted, HTML-escaped attribute
// values), so the targeted regex is enough — no HTML parser needed.
var classAttrRe = regexp.MustCompile(`class="[^"]*"`)

// InlineHTML applies the TransformStyle pipeline to every class="..."
// attribute of rendered HTML. Attributes without a cn- occurrence are
// returned byte-identical, so non-markup matches (e.g. inside inline
// scripts) are never rewritten.
func InlineHTML(htmlSrc string, styleMap StyleMap, opts Options) string {
	return classAttrRe.ReplaceAllStringFunc(htmlSrc, func(match string) string {
		raw := match[len(`class="`) : len(match)-1]
		if !strings.Contains(raw, cnPrefix) {
			return match
		}
		value := html.UnescapeString(raw)
		transformed := transformClassValue(value, styleMap, opts)
		if transformed == value {
			return match
		}
		return `class="` + html.EscapeString(transformed) + `"`
	})
}

// transformClassValue runs the transformers over one class list by treating
// it as a single string literal — the exact TransformStyle pipeline, in the
// exact order, no duplicated logic.
func transformClassValue(value string, styleMap StyleMap, opts Options) string {
	f := &sourceFile{segments: []segment{{kind: segmentStringLiteral, quote: '"', text: value}}}
	for _, transformer := range transformers {
		transformer(f, styleMap, opts)
	}
	return f.segments[0].text
}
