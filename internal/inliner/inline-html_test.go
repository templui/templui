// InlineHTML: the rendered-markup pendant of the TransformStyle tests, plus
// the command input-group regression — the case where the stylesheet cascade
// could not reproduce twMerge's caller-wins semantics (.cn-command-input-group
// lost against the later .cn-input-group rule and the command box showed a
// full-opacity border shadcn's compiled docs don't have).
package inliner

import (
	"html"
	"strings"
	"testing"
)

// TestInlineHTMLCommandInputGroup inlines the real rendered class list of the
// command input box against the vendored style-nova.css and asserts twMerge
// semantics: the cn-command-input-group utilities (later cn class) win over
// the cn-input-group ones, so border-input/30 survives and the bare
// border-input token is dropped.
func TestInlineHTMLCommandInputGroup(t *testing.T) {
	styleMap := loadNovaStyleMap(t)

	in := `<div role="group" data-slot="input-group" class="group/input-group cn-input-group relative flex w-full min-w-0 items-center outline-none has-[&gt;textarea]:h-auto cn-command-input-group"><input></div>`
	out := InlineHTML(in, styleMap, Options{})

	tokens := classTokens(t, out)
	if !tokens["border-input/30"] {
		t.Errorf("border-input/30 missing: %q", out)
	}
	if tokens["border-input"] {
		t.Errorf("bare border-input survived, twMerge should drop it: %q", out)
	}
	for token := range tokens {
		if strings.HasPrefix(token, "cn-") {
			t.Errorf("cn class %q survived: %q", token, out)
		}
	}
	if !tokens["has-[>textarea]:h-auto"] {
		t.Errorf("literal utility has-[>textarea]:h-auto lost: %q", out)
	}
	if !strings.Contains(out, `role="group" data-slot="input-group"`) || !strings.Contains(out, "<input>") {
		t.Errorf("non-class markup was rewritten: %q", out)
	}
}

func TestInlineHTML(t *testing.T) {
	styleMap := StyleMap{"cn-a": "bg-red-500 px-2"}

	tests := []struct {
		name string
		in   string
		opts Options
		want string
	}{
		{
			name: "utilities merge in, literal wins conflicts",
			in:   `<div class="cn-a bg-blue-500"></div>`,
			want: `<div class="px-2 bg-blue-500"></div>`,
		},
		{
			name: "unknown cn classes are dropped",
			in:   `<div class="cn-unknown flex"></div>`,
			want: `<div class="flex"></div>`,
		},
		{
			name: "attributes without cn stay byte-identical",
			in:   `<div class="flex has-[&gt;svg]:px-3" data-x="cn-a"></div>`,
			want: `<div class="flex has-[&gt;svg]:px-3" data-x="cn-a"></div>`,
		},
		{
			name: "escaped entities survive the round trip",
			in:   `<div class="cn-a has-[&gt;svg]:px-3 [&amp;_svg]:size-4"></div>`,
			want: `<div class="bg-red-500 px-2 has-[&gt;svg]:px-3 [&amp;_svg]:size-4"></div>`,
		},
		{
			name: "cn-rtl-flip is stripped by default",
			in:   `<svg class="cn-rtl-flip size-4"></svg>`,
			want: `<svg class="size-4"></svg>`,
		},
		{
			name: "cn-rtl-flip becomes rtl:rotate-180 with RTL",
			in:   `<svg class="cn-rtl-flip size-4"></svg>`,
			opts: Options{RTL: true},
			want: `<svg class="rtl:rotate-180 size-4"></svg>`,
		},
		{
			name: "cn-font-heading follows the option",
			in:   `<h2 class="cn-font-heading text-lg"></h2>`,
			opts: Options{FontHeading: true},
			want: `<h2 class="font-heading text-lg"></h2>`,
		},
		{
			name: "menu and logical-sides markers are stripped",
			in:   `<div class="cn-menu-target cn-menu-translucent cn-logical-sides z-50"></div>`,
			want: `<div class="z-50"></div>`,
		},
		{
			name: "script content without class attributes is untouched",
			in:   `<script>const c = "cn-a";</script>`,
			want: `<script>const c = "cn-a";</script>`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := InlineHTML(tt.in, styleMap, tt.opts); got != tt.want {
				t.Errorf("InlineHTML(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

// classTokens collects the unescaped tokens of every class attribute.
func classTokens(t *testing.T, htmlSrc string) map[string]bool {
	t.Helper()
	tokens := map[string]bool{}
	for _, match := range classAttrRe.FindAllString(htmlSrc, -1) {
		value := html.UnescapeString(match[len(`class="`) : len(match)-1])
		for _, token := range strings.Fields(value) {
			tokens[token] = true
		}
	}
	return tokens
}
