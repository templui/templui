// Guard for the invariant transform-style-map.ts inherits from cva: every
// class string literal is a complete token list. transformStyleMap rewrites
// cn-containing literals with collapsed, trimmed whitespace, so a literal
// that relies on leading/trailing spaces for Go string concatenation
// ("select-none "+align) ships broken through the registry while the docs'
// post-concatenation HTML pass stays correct. tsx sources cannot express
// this (cva variants are separate complete strings); templ sources can, so
// the invariant is enforced here over every registry-listed .templ file.
package inliner

import (
	"os"
	"strings"
	"testing"

	"github.com/axadrn/shadcn-templ/v2/internal/registry"
)

func TestRegistryTemplClassLiteralsAreSelfContained(t *testing.T) {
	seen := map[string]bool{}
	for _, item := range registry.Get().Items {
		for _, path := range item.FilePaths() {
			if !strings.HasSuffix(path, ".templ") || seen[path] {
				continue
			}
			seen[path] = true

			source, err := os.ReadFile("../../" + path)
			if err != nil {
				t.Fatalf("read %s: %v", path, err)
			}
			f, err := parseSourceFile(string(source))
			if err != nil {
				t.Fatalf("parse %s: %v", path, err)
			}
			for _, s := range f.segments {
				if s.kind != segmentStringLiteral {
					continue
				}
				if len(extractCnClasses(s.text)) == 0 {
					continue
				}
				if s.text != strings.TrimSpace(s.text) {
					t.Errorf("%s: cn- literal %q starts or ends with whitespace; the style transform trims literals, so concatenation around it breaks — pass class fragments as separate utils.CN arguments instead", path, s.text)
				}
			}
		}
	}
	if len(seen) == 0 {
		t.Fatal("no .templ files found in registry.json")
	}
}
