// Style item building for GET /r/styles/{style}/{name}.json, the pendant of
// shadcn's per-style registry items (registry/base-nova/ui/button.tsx ->
// r/styles/base-nova/button.json). A .templ source is compiled through the
// inliner with the style's map so the served content carries the flat
// Tailwind classes of that style and no cn-* markers; .js files ship
// verbatim.
package registryapi

import (
	"fmt"
	"os"
	"strings"
	"sync"

	shadcntempl "github.com/axadrn/shadcn-templ/v2"
	"github.com/axadrn/shadcn-templ/v2/assets"
	"github.com/axadrn/shadcn-templ/v2/blocks"
	"github.com/axadrn/shadcn-templ/v2/components"
	"github.com/axadrn/shadcn-templ/v2/internal/inliner"
	"github.com/axadrn/shadcn-templ/v2/internal/registry"
	"github.com/axadrn/shadcn-templ/v2/internal/shared"
)

// isDevelopment mirrors components/scripts.go: outside production every
// request recompiles from disk so edits hot-reload.
func isDevelopment() bool {
	return os.Getenv("GO_ENV") != "production"
}

// StyleNames returns the routable style names: shadcn-templ's single base
// prefixed onto every style (base-vega .. base-rhea).
func StyleNames() []string {
	out := make([]string, len(Styles))
	for i, s := range Styles {
		out[i] = "base-" + s
	}
	return out
}

// splitStyleName validates a route style name ("base-nova") and returns the
// bare style ("nova").
func splitStyleName(styleName string) (string, bool) {
	bare, ok := strings.CutPrefix(styleName, "base-")
	if !ok || !contains(Styles, bare) {
		return "", false
	}
	return bare, true
}

var (
	styleMapMu    sync.Mutex
	styleMapCache = map[string]inliner.StyleMap{}
)

// styleMapFor loads and parses assets/css/styles/style-<name>.css into a
// style map; cached per style in production, fresh from disk in development.
func styleMapFor(bare string) (inliner.StyleMap, error) {
	if !isDevelopment() {
		styleMapMu.Lock()
		cached, ok := styleMapCache[bare]
		styleMapMu.Unlock()
		if ok {
			return cached, nil
		}
	}

	rel := "css/styles/style-" + bare + ".css"
	var css []byte
	var err error
	if isDevelopment() {
		css, err = os.ReadFile("./assets/" + rel)
	} else {
		css, err = assets.Assets.ReadFile(rel)
	}
	if err != nil {
		return nil, fmt.Errorf("registryapi: read style css %s: %w", rel, err)
	}

	styleMap, err := inliner.CreateStyleMap(string(css))
	if err != nil {
		return nil, fmt.Errorf("registryapi: parse style css %s: %w", rel, err)
	}

	if !isDevelopment() {
		styleMapMu.Lock()
		styleMapCache[bare] = styleMap
		styleMapMu.Unlock()
	}
	return styleMap, nil
}

// componentSource reads a registry file path ("components/button/button.templ",
// "blocks/sidebar07/page.templ", "utils/shadcntempl.go") from disk in
// development, from the embeds in production.
func componentSource(filePath string) ([]byte, error) {
	if isDevelopment() {
		return os.ReadFile("./" + filePath)
	}
	if strings.HasPrefix(filePath, "utils/") {
		return shadcntempl.UtilsFiles.ReadFile(filePath)
	}
	if strings.HasPrefix(filePath, "blocks/") {
		return blocks.TemplFiles.ReadFile(strings.TrimPrefix(filePath, "blocks/"))
	}
	return components.TemplFiles.ReadFile(strings.TrimPrefix(filePath, "components/"))
}

var (
	itemMu    sync.Mutex
	itemCache = map[string]*Item{}
)

// BuildStyleItem builds the registry:item JSON of one component compiled for
// one style. Returns (nil, nil) when style or component are unknown (the 404
// case). Results are cached per style+name in production and rebuilt on
// every call in development.
func BuildStyleItem(styleName, name string) (*Item, error) {
	bare, ok := splitStyleName(styleName)
	if !ok {
		return nil, nil
	}
	def := registry.Find(name)
	if def == nil {
		return nil, nil
	}

	cacheKey := styleName + "/" + name
	if !isDevelopment() {
		itemMu.Lock()
		cached, ok := itemCache[cacheKey]
		itemMu.Unlock()
		if ok {
			return cached, nil
		}
	}

	styleMap, err := styleMapFor(bare)
	if err != nil {
		return nil, err
	}

	files := make([]ItemFile, 0, len(def.Files))
	for _, file := range def.Files {
		src, err := componentSource(file.Path)
		if err != nil {
			return nil, fmt.Errorf("registryapi: read %s: %w", file.Path, err)
		}
		content := string(src)
		if strings.HasSuffix(file.Path, ".templ") {
			content, err = inliner.TransformStyle(content, styleMap, inliner.Options{})
			if err != nil {
				return nil, fmt.Errorf("registryapi: inline %s for %s: %w", file.Path, styleName, err)
			}
		}
		files = append(files, ItemFile{
			Path:    file.Path,
			Content: content,
			Type:    file.Type,
			Target:  file.Target,
		})
	}

	item := &Item{
		Schema:               shared.BaseURL() + "/schema/registry-item.json",
		Name:                 def.Name,
		RegistryDependencies: def.RegistryDependencies,
		Files:                files,
		Type:                 def.Type,
	}
	if def.Type == "registry:ui" {
		item.Meta = &ItemMeta{
			Links: ItemLinks{Docs: shared.BaseURL() + "/docs/components/" + def.Name},
		}
	}
	// Block items ship their description, categories and preview height, the
	// shape of shadcn's served registry:block items.
	if def.Type == "registry:block" {
		item.Description = def.Description
		item.Categories = def.Categories
		if def.Meta != nil && def.Meta.IframeHeight != "" {
			item.Meta = &ItemMeta{IframeHeight: def.Meta.IframeHeight}
		}
	}

	if !isDevelopment() {
		itemMu.Lock()
		itemCache[cacheKey] = item
		itemMu.Unlock()
	}
	return item, nil
}

// BuildStyleIndex is the pendant of r/styles/<style>/index.json: the
// registry:style item a CLI resolves first. files and cssVars are present
// but empty, like the golden output.
func BuildStyleIndex(styleName string) *Item {
	if _, ok := splitStyleName(styleName); !ok {
		return nil
	}
	return &Item{
		Schema:               shared.BaseURL() + "/schema/registry-item.json",
		Name:                 "index",
		Dependencies:         []string{ModuleDependency},
		RegistryDependencies: []string{"utils"},
		Files:                []ItemFile{},
		CSSVars:              &ItemVars{},
		CSS:                  baseCSS(false),
		Type:                 "registry:style",
	}
}
