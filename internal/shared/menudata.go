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
				Text: "Package Imports",
				Href: "/docs/package-imports",
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
			// Changelog before llms.txt, per shadcn's (root)/meta.json order.
			{
				Text: "Changelog",
				Href: "/docs/changelog",
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
	// Utilities before Registry, per shadcn's root meta.json section order
	// (utils, registry); the page lists mirror utils/meta.json and the
	// ported subset of registry/meta.json.
	{
		Title: "Utilities",
		Links: []SideLink{
			{
				Text: "scroll-fade",
				Href: "/docs/utils/scroll-fade",
			},
			{
				Text: "shimmer",
				Href: "/docs/utils/shimmer",
			},
		},
	},
	{
		Title: "Registry",
		Links: []SideLink{
			{
				Text: "Introduction",
				Href: "/docs/registry",
			},
			{
				Text: "Getting Started",
				Href: "/docs/registry/getting-started",
			},
			{
				Text: "registry.json",
				Href: "/docs/registry/registry-json",
			},
			{
				Text: "registry-item.json",
				Href: "/docs/registry/registry-item-json",
			},
		},
	},
}
