package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// registryFile mirrors the repo-root registry.json (shadcn's registry.json
// schema).
type registryFile struct {
	Schema   string         `json:"$schema"`
	Name     string         `json:"name"`
	Homepage string         `json:"homepage"`
	Items    []registryItem `json:"items"`
}

// registryItem is a registry item in shadcn's registry-item.json schema (the
// fields the CLI uses).
type registryItem struct {
	Name                 string             `json:"name"`
	Type                 string             `json:"type"`
	Title                string             `json:"title"`
	Description          string             `json:"description"`
	RegistryDependencies []string           `json:"registryDependencies"`
	Files                []registryItemFile `json:"files"`
}

// registryItemFile is one files[] entry of a registry item.
type registryItemFile struct {
	Path string `json:"path"`
	Type string `json:"type"`
}

// Registry is the CLI's flat view of the registry: components (registry:ui
// items) and utils (the files of registry:lib items).
type Registry struct {
	Components []ComponentDef
	Utils      []UtilDef
}

// ComponentDef describes a single component within the registry. Name is the
// kebab-case registry item name (alert-dialog), which doubles as the docs
// slug.
type ComponentDef struct {
	Name         string
	Description  string
	Files        []string // Paths relative to the repository root
	Dependencies []string // Names of other required registry items
}

// UtilDef describes a single utility file within the registry.
type UtilDef struct {
	Path        string // Path relative to the repository root
	Description string
}

// fetchRegistry downloads and parses the registry.json file for a given git ref.
func fetchRegistry(ref string) (Registry, error) {
	registryURL := buildRawContentURL(ref, registryPath)
	resp, err := http.Get(registryURL)
	if err != nil {
		return Registry{}, fmt.Errorf("failed to start download: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return Registry{}, fmt.Errorf("failed to download registry from %s: status code %d, message: %s", registryURL, resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return Registry{}, fmt.Errorf("failed to read response body: %w", err)
	}

	var file registryFile
	err = json.Unmarshal(body, &file)
	if err != nil {
		return Registry{}, fmt.Errorf("failed to parse registry JSON (from %s): %w", registryURL, err)
	}

	var registry Registry
	for _, item := range file.Items {
		switch item.Type {
		case "registry:ui":
			files := make([]string, len(item.Files))
			for i, f := range item.Files {
				files[i] = f.Path
			}
			registry.Components = append(registry.Components, ComponentDef{
				Name:         item.Name,
				Description:  item.Description,
				Files:        files,
				Dependencies: item.RegistryDependencies,
			})
		case "registry:lib":
			for _, f := range item.Files {
				registry.Utils = append(registry.Utils, UtilDef{
					Path:        f.Path,
					Description: item.Description,
				})
			}
		}
	}

	return registry, nil
}

// downloadFile fetches the content of a single file from a URL.
func downloadFile(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to start download from %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to download file from %s: status code %d, message: %s", url, resp.StatusCode, string(bodyBytes))
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body from %s: %w", url, err)
	}
	return data, nil
}
