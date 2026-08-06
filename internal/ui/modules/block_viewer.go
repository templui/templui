package modules

import (
	"sort"
	"strconv"
	"strings"
)

// BlockFile is one source file of a block shown in the code tab, the
// pendant of block-viewer.tsx's highlightedFiles entries.
type BlockFile struct {
	Path    string
	Content string
}

// BlockEntry is one gallery block, the item shape BlockViewer consumes
// (shadcn's registryItemSchema fields the viewer reads).
type BlockEntry struct {
	Name         string
	Description  string
	IframeHeight string
	Files        []BlockFile
}

// Height returns the preview height with shadcn's 930px default.
func (b BlockEntry) Height() string {
	if b.IframeHeight != "" {
		return b.IframeHeight
	}
	return "930px"
}

// HeightPx returns the height as the iframe's numeric height attribute.
func (b BlockEntry) HeightPx() int {
	n, err := strconv.Atoi(strings.TrimSuffix(b.Height(), "px"))
	if err != nil {
		return 930
	}
	return n
}

// blockFileTree is the FileTree pendant of lib/registry's
// createFileTreeForRegistryItemFiles: nested folders down to file leaves.
type blockFileTree struct {
	Name     string
	Path     string
	Children []*blockFileTree
}

// buildBlockFileTree folds the file paths into a folder tree.
func buildBlockFileTree(files []BlockFile) []*blockFileTree {
	root := &blockFileTree{}
	for _, f := range files {
		parts := strings.Split(f.Path, "/")
		node := root
		for i, part := range parts {
			isLeaf := i == len(parts)-1
			var child *blockFileTree
			for _, c := range node.Children {
				if c.Name == part {
					child = c
					break
				}
			}
			if child == nil {
				child = &blockFileTree{Name: part}
				if isLeaf {
					child.Path = f.Path
				}
				node.Children = append(node.Children, child)
			}
			node = child
		}
	}
	var sortTree func(nodes []*blockFileTree)
	sortTree = func(nodes []*blockFileTree) {
		sort.SliceStable(nodes, func(i, j int) bool {
			// Folders before files, then name order, like the reference tree.
			iDir := len(nodes[i].Children) > 0
			jDir := len(nodes[j].Children) > 0
			if iDir != jDir {
				return iDir
			}
			return nodes[i].Name < nodes[j].Name
		})
		for _, n := range nodes {
			sortTree(n.Children)
		}
	}
	sortTree(root.Children)
	return root.Children
}

// blockFileLanguage maps a file extension onto the shiki language, the
// getIconForLanguageExtension/data-language pendant.
func blockFileLanguage(path string) string {
	switch {
	case strings.HasSuffix(path, ".templ"):
		return "templ"
	case strings.HasSuffix(path, ".go"):
		return "go"
	case strings.HasSuffix(path, ".js"):
		return "javascript"
	case strings.HasSuffix(path, ".json"):
		return "json"
	}
	return "text"
}
