package shared

import (
	"sort"

	"github.com/templui/templui/internal/registry"
)

type SideLink struct {
	Text  string
	Href  string
	Icon  string
	Click string
}

type Section struct {
	Title string
	Links []SideLink
}

// loadComponentsFromRegistry reads the registry and generates component links.
func loadComponentsFromRegistry() []SideLink {
	reg := registry.Get()

	var links []SideLink
	for _, comp := range reg.Components {
		links = append(links, SideLink{
			Text: comp.DisplayName,
			Href: "/docs/components/" + comp.Slug,
		})
	}

	// Sort alphabetically by display name
	sort.Slice(links, func(i, j int) bool {
		return links[i].Text < links[j].Text
	})

	return links
}

var Sections = []Section{
	{
		Title: "Getting Started",
		Links: []SideLink{
			{
				Text: "Introduction",
				Href: "/docs/introduction",
			},
			{
				Text: "How to Use",
				Href: "/docs/how-to-use",
			},
			{
				Text: "Theming",
				Href: "/docs/theming",
			},
			{
				Text: "Typeset",
				Href: "/docs/typeset",
			},
			{
				Text: "Dark Mode",
				Href: "/docs/dark-mode",
			},
			{
				Text: "llms.txt",
				Href: "/llms.txt",
			},
		},
	},
	{
		Title: "Components",
		Links: loadComponentsFromRegistry(),
	},
}
