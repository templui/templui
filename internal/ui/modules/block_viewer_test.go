package modules

import (
	"bytes"
	"context"
	"os"
	"strings"
	"testing"
)

func TestBuildBlockFileTreePreservesRegistryOrder(t *testing.T) {
	files := []BlockFile{
		{Path: "blocks/dashboard01/page.templ"},
		{Path: "blocks/dashboard01/data.go"},
		{Path: "blocks/dashboard01/app_sidebar.templ"},
	}

	tree := buildBlockFileTree(files)
	dashboard := tree[0].Children[0]

	for i, want := range []string{"page.templ", "data.go", "app_sidebar.templ"} {
		if got := dashboard.Children[i].Name; got != want {
			t.Fatalf("file %d: got %q, want %q", i, got, want)
		}
	}
}

func TestBlockViewerCodeKeepsFlexLayoutWhenSwitchingFiles(t *testing.T) {
	source, err := os.ReadFile("block_viewer.templ")
	if err != nil {
		t.Fatal(err)
	}

	templSource := string(source)
	for _, want := range []string{
		`data-block-file-pane={ file.Path }`,
		`if i != 0 {`,
		`hidden`,
		`class="mx-0! mt-0 flex min-w-0 flex-1 flex-col rounded-xl border-none"`,
		`overflow-y-auto`,
		`data-block-file-scroll`,
	} {
		if !strings.Contains(templSource, want) {
			t.Fatalf("block viewer source is missing %q", want)
		}
	}
}

func TestBlockViewerUsesResizablePrimitiveComposition(t *testing.T) {
	entry := BlockEntry{Name: "dashboard-01", IframeHeight: "930px"}

	var rendered bytes.Buffer
	if err := blockViewerView(entry).Render(context.Background(), &rendered); err != nil {
		t.Fatal(err)
	}

	html := rendered.String()
	for _, want := range []string{
		`data-slot="resizable-panel-group"`,
		`id="dashboard-01-preview-panel"`,
		`data-default-size="100%"`,
		`data-min-size="30%"`,
		`data-slot="resizable-handle"`,
		`id="dashboard-01-preview-spacer"`,
		`data-default-size="0%"`,
		`class="relative z-20 no-scrollbar w-full bg-background"`,
	} {
		if !strings.Contains(html, want) {
			t.Fatalf("block viewer is missing %q", want)
		}
	}
	if strings.Contains(html, `data-block-panel style="width:`) {
		t.Fatal("block viewer still uses the legacy inline-width resize implementation")
	}
}
