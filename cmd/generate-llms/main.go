package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"
)

// Registry defines the structure of the registry.json file.
type Registry struct {
	Components []ComponentDef `json:"components"`
	Utils      []UtilDef      `json:"utils"`
}

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

// Category mappings for organizing components
var categoryNames = map[string]string{
	"form-input":        "Form & Input",
	"layout-navigation": "Layout & Navigation",
	"overlays-dialogs":  "Overlays & Dialogs",
	"feedback-status":   "Feedback & Status",
	"display-media":     "Display & Media",
	"misc":              "Misc",
}

// Category order for consistent output
var categoryOrder = []string{
	"form-input",
	"layout-navigation",
	"overlays-dialogs",
	"feedback-status",
	"display-media",
	"misc",
}

func main() {
	registryPath := "internal/registry/registry.json"
	outputPath := "static/llms.txt"

	// Read registry.json
	data, err := os.ReadFile(registryPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading registry.json: %v\n", err)
		os.Exit(1)
	}

	var registry Registry
	err = json.Unmarshal(data, &registry)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing registry.json: %v\n", err)
		os.Exit(1)
	}

	// Group components by category
	componentsByCategory := make(map[string][]ComponentDef)
	for _, comp := range registry.Components {
		if len(comp.Categories) == 0 {
			// Fallback to "misc" if no category
			componentsByCategory["misc"] = append(componentsByCategory["misc"], comp)
		} else {
			// Add to first category (primary category)
			category := comp.Categories[0]
			componentsByCategory[category] = append(componentsByCategory[category], comp)
		}
	}

	// Sort components within each category alphabetically
	for category := range componentsByCategory {
		sort.Slice(componentsByCategory[category], func(i, j int) bool {
			return componentsByCategory[category][i].Name < componentsByCategory[category][j].Name
		})
	}

	// Generate llms.txt content
	var output strings.Builder

	// Header
	output.WriteString(`# templui Components

> templ-based UI components for Go. Open source. Customizable. Accessible.

## Overview

templui is a collection of beautifully designed, accessible UI components built with templ and Go.
Components are designed to be composable, customizable, and easy to integrate into your Go projects.

- [Introduction](https://templui.io/docs/introduction): Core principles and getting started guide
- [How to Use](https://templui.io/docs/how-to-use): CLI installation and usage guide
- [Components](https://templui.io/docs/components): Component overview and catalog
- [Themes](https://templui.io/docs/themes): Theme customization and styling
- [GitHub](https://github.com/templui/templui): Source code and issue tracker

`)

	// Components by category
	for _, category := range categoryOrder {
		components, exists := componentsByCategory[category]
		if !exists || len(components) == 0 {
			continue
		}

		categoryName := categoryNames[category]
		output.WriteString(fmt.Sprintf("## %s\n\n", categoryName))

		for _, comp := range components {
			docURL := fmt.Sprintf("https://templui.io/docs/components/%s", comp.Slug)
			output.WriteString(fmt.Sprintf("- [%s](%s): %s\n", comp.DisplayName, docURL, comp.Description))
		}
		output.WriteString("\n")
	}

	// Write to file
	err = os.WriteFile(outputPath, []byte(output.String()), 0644)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error writing llms.txt: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("✅ Generated %s successfully!\n", outputPath)
	fmt.Printf("   Components: %d\n", len(registry.Components))
	fmt.Printf("   Categories: %d\n", len(componentsByCategory))
}
