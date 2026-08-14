package blocks

import (
	"bytes"
	"context"
	"strings"
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

func TestVerticalBlockSeparatorsUseBaseUIAlignment(t *testing.T) {
	for _, item := range registry.Blocks() {
		component := Component(item.Name)
		if component == nil {
			continue
		}

		var output bytes.Buffer
		if err := component.Render(context.Background(), &output); err != nil {
			t.Fatalf("%s: render: %v", item.Name, err)
		}

		for _, fragment := range strings.Split(output.String(), "<div")[1:] {
			tag, _, _ := strings.Cut(fragment, ">")
			if !strings.Contains(tag, `data-slot="separator"`) || !strings.Contains(tag, `data-orientation="vertical"`) {
				continue
			}
			if strings.Contains(tag, `data-[orientation=vertical]`) {
				t.Fatalf("%s: vertical separator still uses a Radix orientation selector: %s", item.Name, tag)
			}
			if !strings.Contains(tag, `data-vertical:self-auto`) {
				t.Fatalf("%s: compact vertical separator is missing the Base UI alignment override: %s", item.Name, tag)
			}
		}
	}
}
