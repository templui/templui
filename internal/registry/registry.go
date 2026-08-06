// Package registry loads the repo-root registry.json, which follows shadcn's
// registry.json / registry-item.json schema: a flat items list where every
// component is a registry:ui item and lib files are registry:lib items. The
// item name is the kebab-case shadcn name (alert-dialog) and doubles as the
// docs slug; the human readable name is the title.
package registry

import (
	"encoding/json"
	"log"
	"slices"

	shadcntempl "github.com/axadrn/shadcn-templ/v2"
)

// File is one files[] entry of a registry item. Target is the explicit
// install path of block pages (shadcn's target field); empty for the
// components-dir mapped files.
type File struct {
	Path   string `json:"path"`
	Type   string `json:"type"`
	Target string `json:"target,omitempty"`
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
	Meta                 *Meta    `json:"meta,omitempty"`
}

// Meta is the freeform meta block of an item; blocks carry the iframe
// height of their /blocks preview (shadcn's meta.iframeHeight).
type Meta struct {
	IframeHeight string `json:"iframeHeight,omitempty"`
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

// Find returns the installable item (registry:ui, registry:lib,
// registry:example or registry:block, e.g. the
// utils lib item) with the given name, or nil.
func Find(name string) *Item {
	items := Get().Items
	for i := range items {
		switch items[i].Type {
		case "registry:ui", "registry:lib", "registry:example", "registry:block":
			if items[i].Name == name {
				return &items[i]
			}
		}
	}
	return nil
}

// Blocks returns the registry:block items, optionally filtered by category,
// in registry.json order - the pendant of lib/blocks.ts getAllBlocks.
func Blocks(categories ...string) []Item {
	var out []Item
	for _, it := range Get().Items {
		if it.Type != "registry:block" {
			continue
		}
		if len(categories) > 0 && !slices.ContainsFunc(it.Categories, func(c string) bool {
			return slices.Contains(categories, c)
		}) {
			continue
		}
		out = append(out, it)
	}
	return out
}
