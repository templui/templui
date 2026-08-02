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
	var links []SideLink
	for _, comp := range registry.Components() {
		links = append(links, SideLink{
			Text: comp.Title,
			Href: "/docs/components/" + comp.Name,
		})
	}

	// Sort alphabetically by title
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
				Text: "Installation",
				Href: "/docs/installation",
			},
			// Order per shadcn's (root)/meta.json: components.json follows
			// Installation, CLI follows the Dark Mode link.
			{
				Text: "components.json",
				Href: "/docs/components-json",
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
				Text: "CLI",
				Href: "/docs/cli",
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
