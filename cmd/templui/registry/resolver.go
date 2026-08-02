// The pendant of shadcn/src/registry/resolver.ts (resolveRegistryTree):
// resolve the requested items and their registryDependencies recursively into
// one merged install tree. Dependencies sort before dependents and theme/base
// items sort first, so their cssVars are applied first and dependents can
// override.
package registry

import (
	"strings"
)

// ResolveTree fetches every requested item (name or URL) plus its
// registryDependencies recursively and merges them into a Tree.
func ResolveTree(registryURL, style string, namesOrURLs []string) (*Tree, error) {
	var payload []*Item
	visited := map[string]bool{}
	var fontDeps []string

	var resolve func(nameOrURL string) error
	resolve = func(nameOrURL string) error {
		if visited[nameOrURL] {
			return nil
		}
		visited[nameOrURL] = true

		// The templUI registry has no font items; collect font-* deps for the
		// post-install note instead of fetching them (shadcn installs
		// fontsource npm packages here, which have no Go pendant).
		if strings.HasPrefix(nameOrURL, "font-") {
			fontDeps = append(fontDeps, nameOrURL)
			return nil
		}

		item, err := GetItem(registryURL, style, nameOrURL)
		if err != nil {
			return err
		}

		// Dependencies first (topological order: deps before dependents).
		for _, dep := range item.RegistryDependencies {
			if err := resolve(dep); err != nil {
				return err
			}
		}

		payload = append(payload, item)
		return nil
	}

	for _, name := range namesOrURLs {
		if err := resolve(name); err != nil {
			return nil, err
		}
	}

	if len(payload) == 0 {
		return nil, nil
	}

	// registry:theme/base/style items first, keeping relative order.
	var first, rest []*Item
	for _, item := range payload {
		switch item.Type {
		case "registry:theme", "registry:base", "registry:style":
			first = append(first, item)
		default:
			rest = append(rest, item)
		}
	}
	hasThemeItem := len(first) > 0
	payload = append(first, rest...)

	tree := &Tree{
		CSSVars:          &ItemVars{Theme: NewOrderedMap(), Light: NewOrderedMap(), Dark: NewOrderedMap()},
		CSS:              NewOrderedMap(),
		FontDependencies: fontDeps,
		HasThemeItem:     hasThemeItem,
	}

	seenDeps := map[string]bool{}
	seenFiles := map[string]bool{}
	for _, item := range payload {
		for _, dep := range item.Dependencies {
			if !seenDeps[dep] {
				seenDeps[dep] = true
				tree.Dependencies = append(tree.Dependencies, dep)
			}
		}
		for _, file := range item.Files {
			key := file.Target
			if key == "" {
				key = file.Path
			}
			if !seenFiles[key] {
				seenFiles[key] = true
				tree.Files = append(tree.Files, file)
			}
		}
		if item.CSSVars != nil {
			tree.CSSVars.Theme.Merge(item.CSSVars.Theme)
			tree.CSSVars.Light.Merge(item.CSSVars.Light)
			tree.CSSVars.Dark.Merge(item.CSSVars.Dark)
		}
		tree.CSS.Merge(item.CSS)
		if item.Docs != "" {
			tree.Docs += item.Docs + "\n"
		}
	}

	return tree, nil
}
