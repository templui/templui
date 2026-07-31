// Pendant of shadcn packages/shadcn/src/styles/transform-style-map.test.ts:
// the replacement semantics of TransformStyle, plus a golden test that
// inlines components/button/button.templ with the vendored style-nova.css.
package inliner

import (
	"os"
	"strings"
	"testing"
)

func TestTransformStyleButtonTempl(t *testing.T) {
	styleMap := loadNovaStyleMap(t)
	source, err := os.ReadFile("../../components/button/button.templ")
	if err != nil {
		t.Fatalf("read button.templ: %v", err)
	}

	out, err := TransformStyle(string(source), styleMap, Options{})
	if err != nil {
		t.Fatalf("TransformStyle: %v", err)
	}

	if !strings.Contains(out, `return "`+novaButtonVariantDefault+`"`) {
		t.Errorf("default variant did not expand to the exact nova utilities")
	}
	if strings.Contains(out, "cn-") {
		t.Errorf("inlined output still contains cn-")
	}
	if !strings.Contains(out, "bg-primary") {
		t.Errorf("inlined output misses bg-primary")
	}
}

func TestTransformStyle(t *testing.T) {
	styleMap := StyleMap{"cn-a": "bg-red-500 px-2"}

	tests := []struct {
		name string
		in   string
		opts Options
		want string
	}{
		{
			name: "merge keeps literal utilities winning conflicts",
			in:   `const c = "cn-a bg-blue-500"`,
			want: `const c = "px-2 bg-blue-500"`,
		},
		{
			name: "utilities come first, in style map order",
			in:   `const c = "cn-a shrink-0"`,
			want: `const c = "bg-red-500 px-2 shrink-0"`,
		},
		{
			name: "unknown cn classes are dropped",
			in:   `const c = "cn-unknown flex"`,
			want: `const c = "flex"`,
		},
		{
			name: "no token boundary means no replacement",
			in:   `const c = "xcn-a flex"`,
			want: `const c = "xcn-a flex"`,
		},
		{
			name: "templ markup attribute is a string literal",
			in:   `<div class="cn-a shrink-0"></div>`,
			want: `<div class="bg-red-500 px-2 shrink-0"></div>`,
		},
		{
			name: "comments lose their cn references",
			in:   "// the look comes from the cn-a classes\nconst c = \"cn-a\"",
			want: "// the look comes from the classes\nconst c = \"bg-red-500 px-2\"",
		},
		{
			name: "apostrophe in markup text does not derail the lexer",
			in:   "<p>don't</p>\n<div class=\"cn-a\"></div>",
			want: "<p>don't</p>\n<div class=\"bg-red-500 px-2\"></div>",
		},
		{
			name: "cn-rtl-flip is stripped by default",
			in:   `icon.Props{Class: "cn-rtl-flip size-4"}`,
			want: `icon.Props{Class: "size-4"}`,
		},
		{
			name: "cn-rtl-flip becomes rtl:rotate-180 with RTL",
			in:   `icon.Props{Class: "cn-rtl-flip size-4"}`,
			opts: Options{RTL: true},
			want: `icon.Props{Class: "rtl:rotate-180 size-4"}`,
		},
		{
			name: "cn-font-heading is stripped by default",
			in:   `"cn-font-heading text-lg"`,
			want: `"text-lg"`,
		},
		{
			name: "cn-font-heading becomes font-heading when supported",
			in:   `"cn-font-heading text-lg"`,
			opts: Options{FontHeading: true},
			want: `"font-heading text-lg"`,
		},
		{
			name: "menu and logical-sides markers are stripped",
			in:   `"cn-menu-target cn-menu-translucent cn-logical-sides z-50"`,
			want: `"z-50"`,
		},
		{
			name: "raw strings are transformed too",
			in:   "const c = `cn-a flex`",
			want: "const c = `bg-red-500 px-2 flex`",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := TransformStyle(tt.in, styleMap, tt.opts)
			if err != nil {
				t.Fatalf("TransformStyle: %v", err)
			}
			if got != tt.want {
				t.Errorf("TransformStyle(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}
