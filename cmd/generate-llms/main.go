package main

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"
)

// Registry mirrors the repo-root registry.json (shadcn's registry.json
// schema).
type Registry struct {
	Schema   string `json:"$schema"`
	Name     string `json:"name"`
	Homepage string `json:"homepage"`
	Items    []Item `json:"items"`
}

// Item is a registry item in shadcn's registry-item.json schema (the fields
// this generator uses).
type Item struct {
	Name        string   `json:"name"`
	Type        string   `json:"type"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Categories  []string `json:"categories"`
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
	registryPath := "registry.json"
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

	// Components are the registry:ui items.
	var components []Item
	for _, item := range registry.Items {
		if item.Type == "registry:ui" {
			components = append(components, item)
		}
	}

	// Group components by category
	componentsByCategory := make(map[string][]Item)
	for _, comp := range components {
		if len(comp.Categories) == 0 {
			// Fallback to "misc" if no category
			componentsByCategory["misc"] = append(componentsByCategory["misc"], comp)
		} else {
			// Add to first category (primary category)
			category := comp.Categories[0]
			if _, known := categoryNames[category]; !known {
				fmt.Fprintf(os.Stderr, "Error: component %q has unknown category %q (known: %s)\n", comp.Name, category, strings.Join(categoryOrder, ", "))
				os.Exit(1)
			}
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
	output.WriteString(`# templui

> templui is a collection of beautifully-designed, accessible components and a code distribution platform for Go. It is built with Go, templ, Tailwind CSS, and vanilla JavaScript ports of Base UI behavior. It works with any Go web stack and pairs with htmx or plain server-side rendering. Open Source. Open Code. AI-Ready. It also comes with a command-line tool to install and manage components and a registry system to publish and distribute code.

## Overview

- [Introduction](https://templui.io/docs/introduction): Core principles and getting started guide.
- [CLI](https://templui.io/docs/cli): Command-line tool for installing and managing components.
- [Installation](https://templui.io/docs/installation): Installation and setup guide.
- [Components](https://templui.io/docs/components): Component overview and catalog.
- [GitHub](https://github.com/axadrn/shadcn-templ): Source code and issue tracker.

`)

	// Components by category
	for _, category := range categoryOrder {
		items, exists := componentsByCategory[category]
		if !exists || len(items) == 0 {
			continue
		}

		categoryName := categoryNames[category]
		output.WriteString(fmt.Sprintf("## %s\n\n", categoryName))

		for _, comp := range items {
			docURL := fmt.Sprintf("https://templui.io/docs/components/%s", comp.Name)
			output.WriteString(fmt.Sprintf("- [%s](%s): %s\n", comp.Title, docURL, comp.Description))
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
	fmt.Printf("   Components: %d\n", len(components))
	fmt.Printf("   Categories: %d\n", len(componentsByCategory))
}
