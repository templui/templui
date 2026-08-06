// Package registry loads the repo-root registry.json, which follows shadcn's
// registry.json / registry-item.json schema: a flat items list where every
// component is a registry:ui item and lib files are registry:lib items. The
// item name is the kebab-case shadcn name (alert-dialog) and doubles as the
// docs slug; the human readable name is the title.
package registry

import (
	"encoding/json"
	"log"

	shadcntempl "github.com/axadrn/shadcn-templ/v2"
)

// File is one files[] entry of a registry item.
type File struct {
	Path string `json:"path"`
	Type string `json:"type"`
}

// Item is a registry item in shadcn's registry-item.json schema (the fields
// shadcn-templ uses).
type Item struct {
	Name                 string   `json:"name"`
	Type                 string   `json:"type"`
	Title                string   `json:"title,omitempty"`
	Description          string   `json:"description,omitempty"`
	Dependencies         []string `json:"dependencies,omitempty"`
	RegistryDependencies []string `json:"registryDependencies,omitempty"`
	Files                []File   `json:"files"`
	Categories           []string `json:"categories,omitempty"`
}

// FilePaths returns the path of every file of the item.
func (it Item) FilePaths() []string {
	paths := make([]string, len(it.Files))
	for i, f := range it.Files {
		paths[i] = f.Path
	}
	return paths
}

// Registry is the registry.json root in shadcn's registry.json schema.
type Registry struct {
	Schema   string `json:"$schema"`
	Name     string `json:"name"`
	Homepage string `json:"homepage"`
	Items    []Item `json:"items"`
}

var cachedRegistry *Registry

// Get returns the parsed registry, caching it after first load.
func Get() *Registry {
	if cachedRegistry != nil {
		return cachedRegistry
	}

	var r Registry
	err := json.Unmarshal(shadcntempl.RegistryJSON, &r)
	if err != nil {
		log.Printf("Error parsing registry.json: %v", err)
		return &Registry{} // Return empty registry on error
	}

	cachedRegistry = &r
	return cachedRegistry
}

// JSON returns the raw registry.json bytes, served verbatim on
// GET /r/registry.json.
func JSON() []byte {
	return shadcntempl.RegistryJSON
}

// Components returns the registry:ui items.
func Components() []Item {
	var out []Item
	for _, it := range Get().Items {
		if it.Type == "registry:ui" {
			out = append(out, it)
		}
	}
	return out
}

// Find returns the installable item (registry:ui, registry:lib or
// registry:example, e.g. the
// utils lib item) with the given name, or nil.
func Find(name string) *Item {
	items := Get().Items
	for i := range items {
		if (items[i].Type == "registry:ui" || items[i].Type == "registry:lib" || items[i].Type == "registry:example") && items[i].Name == name {
			return &items[i]
		}
	}
	return nil
}
