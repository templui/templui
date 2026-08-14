package modules

import "testing"

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
