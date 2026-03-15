package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// Registry defines the structure of the registry.json file.
type Registry struct {
	Components []ComponentDef `json:"components"`
	Utils      []UtilDef      `json:"utils"`
}

// ComponentDef describes a single component within the registry.
type ComponentDef struct {
	Name          string   `json:"name"`
	Slug          string   `json:"slug"`
	DisplayName   string   `json:"displayName"`
	Description   string   `json:"description"`
	Files         []string `json:"files"`           // Paths relative to the repository root
	Dependencies  []string `json:"dependencies"`    // Names of other required components
	RequiredUtils []string `json:"requiredUtils"`   // Paths to required utils relative to the repository root
	HasJS         bool     `json:"hasJS,omitempty"` // Whether this component requires JavaScript
}

// UtilDef describes a single utility file within the registry.
type UtilDef struct {
	Path        string `json:"path"` // Path relative to the repository root
	Description string `json:"description"`
}

// fetchRegistry downloads and parses the registry.json file for a given git ref.
func fetchRegistry(baseURL, ref string) (Registry, error) {
	registryURL := baseURL + ref + "/" + registryPath
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

	var registry Registry
	err = json.Unmarshal(body, &registry)
	if err != nil {
		return Registry{}, fmt.Errorf("failed to parse registry JSON (from %s): %w", registryURL, err)
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
