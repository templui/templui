package blocks

import (
	"testing"

	"github.com/axadrn/shadcn-templ/v2/internal/registry"
)

func TestEveryRegistryBlockHasViewerData(t *testing.T) {
	t.Setenv("GO_ENV", "production")

	items := registry.Blocks()
	if len(items) == 0 {
		t.Fatal("registry has no blocks")
	}

	for _, item := range items {
		t.Run(item.Name, func(t *testing.T) {
			if Component(item.Name) == nil {
				t.Fatal("missing block component")
			}
			if item.Description == "" {
				t.Fatal("missing block description")
			}
			if len(item.Categories) == 0 {
				t.Fatal("missing block category")
			}
			if len(item.Files) == 0 || item.Files[0].Type != "registry:page" {
				t.Fatal("first registry file must be the active page")
			}

			files := Files(item)
			if len(files) != len(item.Files) {
				t.Fatalf("loaded %d of %d registry files", len(files), len(item.Files))
			}
			for i, file := range files {
				if file.Path != item.Files[i].Path {
					t.Fatalf("file %d: got path %q, want %q", i, file.Path, item.Files[i].Path)
				}
				if file.Content == "" {
					t.Fatalf("file %d (%s) has no content", i, file.Path)
				}
			}
		})
	}
}
