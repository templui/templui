package registry

import (
	_ "embed"
	"encoding/json"
	"log"
)

//go:embed registry.json
var registryJSON []byte

// ComponentDef describes a single component within the registry.
type ComponentDef struct {
	Name         string   `json:"name"`
	Slug         string   `json:"slug"`
	DisplayName  string   `json:"displayName"`
	Description  string   `json:"description"`
	Files        []string `json:"files"`
	JSFiles      []string `json:"jsFiles,omitempty"`
	Dependencies []string `json:"dependencies"`
	Categories   []string `json:"categories"`
	Tags         []string `json:"tags"`
}

// UtilDef describes a single utility file within the registry.
type UtilDef struct {
	Path        string `json:"path"`
	Description string `json:"description"`
}

// Registry defines the structure of the registry.json file.
type Registry struct {
	Components []ComponentDef `json:"components"`
	Utils      []UtilDef      `json:"utils"`
}

var cachedRegistry *Registry

// Get returns the parsed registry, caching it after first load.
func Get() *Registry {
	if cachedRegistry != nil {
		return cachedRegistry
	}

	var r Registry
	err := json.Unmarshal(registryJSON, &r)
	if err != nil {
		log.Printf("Error parsing registry.json: %v", err)
		return &Registry{} // Return empty registry on error
	}

	cachedRegistry = &r
	return cachedRegistry
}
