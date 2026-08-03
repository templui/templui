package shared

import (
	"sort"

	"github.com/templui/templui/internal/registry"
)

// DocSlugs are the markdown-authored docs pages served under /docs/<slug>
// (and their raw markdown under /docs/<slug>.md). cmd/docs registers the
// routes from this list and cmd/sitemap generates the sitemap from it.
var DocSlugs = []string{
	"introduction", "installation", "components-json", "package-imports", "theming", "typeset", "dark-mode", "cli", "changelog",
	"utils/scroll-fade", "utils/shimmer",
	"registry", "registry/getting-started", "registry/registry-json", "registry/registry-item-json",
}

type SideLink struct {
	Text  string
	Href  string
	Icon  string
	Click string
}

// NavItems is the pendant of siteConfig.navItems in shadcn's lib/config.ts,
// reduced to the pages templUI has (no Blocks, no Directory).
var NavItems = []SideLink{
	{Text: "Home", Href: "/"},
	{Text: "Docs", Href: "/docs/installation"},
	{Text: "Components", Href: "/docs/components"},
	{Text: "Charts", Href: "/charts/area"},
	{Text: "Typeset", Href: "/typeset"},
	{Text: "Create", Href: "/create"},
}

// TopLevelSections is the pendant of TOP_LEVEL_SECTIONS, which shadcn
// duplicates verbatim in docs-sidebar.tsx and mobile-nav.tsx; one Go slice
// serves both modules, reduced to the pages templUI has.
var TopLevelSections = []SideLink{
	{Text: "Introduction", Href: "/docs/introduction"},
	{Text: "Components", Href: "/docs/components"},
	{Text: "Installation", Href: "/docs/installation"},
	{Text: "Theming", Href: "/docs/theming"},
	{Text: "CLI", Href: "/docs/cli"},
	{Text: "Typeset", Href: "/docs/typeset"},
	{Text: "Registry", Href: "/docs/registry"},
	{Text: "Changelog", Href: "/docs/changelog"},
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
