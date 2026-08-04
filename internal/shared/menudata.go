package shared

import (
	"slices"
	"sort"

	"github.com/templui/templui/internal/registry"
)

// DocSlugs are the markdown-authored docs pages served under /docs/<slug>
// (and their raw markdown under /docs/<slug>.md). cmd/docs registers the
// routes from this list and cmd/sitemap generates the sitemap from it.
var DocSlugs = []string{
	"introduction", "installation", "components-json", "package-imports", "theming", "typeset", "dark-mode", "cli", "changelog", "import-workflow",
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

// TopLevelSections is the 1:1 pendant of TOP_LEVEL_SECTIONS in shadcn's
// docs-sidebar.tsx (mobile-nav.tsx duplicates it verbatim; one Go slice
// serves both modules): same entries, same order, minus Skills, which has no
// templUI page yet. Their Introduction href is the /docs index page; ours
// lives at /docs/introduction.
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

// ExcludedSidebarSections is the EXCLUDED_SECTIONS pendant: doc tree folders
// the sidebar does not render as groups. shadcn lists installation,
// dark-mode, changelog and rtl there - all folders templUI does not have, so
// the map is empty until one of them grows a section.
var ExcludedSidebarSections = map[string]bool{}

// ExcludedSidebarPages is the EXCLUDED_PAGES pendant: pages that stay in the
// section data (the docs pager walks it) but are not rendered inside their
// group because the "Sections" list above already links them. Theirs excludes
// /docs (their Introduction) and /docs/changelog the same way.
var ExcludedSidebarPages = map[string]bool{
	"/docs/introduction": true,
	"/docs/changelog":    true,
}

// PagesNew is the PAGES_NEW pendant of shadcn's lib/docs.ts: docs URLs that
// render the blue "New" dot in the sidebar, the mobile nav and the components
// list. Ours marks what templUI 2.0 adds over v1: components without a v1
// predecessor (renames like dropdown -> dropdown-menu, radio -> radio-group,
// selectbox -> select do not count, date picker became a pattern page) and
// the new docs pages. Curated by hand like the reference: a PR that adds a
// page adds its entry here, and the list is pruned at the release after the
// one that introduced the entries.
var PagesNew = []string{
	"/docs/typeset",
	"/docs/utils/scroll-fade",
	"/docs/utils/shimmer",
	"/docs/components/alert-dialog",
	"/docs/components/button-group",
	"/docs/components/combobox",
	"/docs/components/command",
	"/docs/components/context-menu",
	"/docs/components/drawer",
	"/docs/components/empty",
	"/docs/components/field",
	"/docs/components/input-group",
	"/docs/components/item",
	"/docs/components/kbd",
	"/docs/components/spinner",
	"/docs/components/toggle",
	"/docs/components/toggle-group",
}

// PageIsNew reports whether a docs URL is in PagesNew.
func PageIsNew(href string) bool {
	return slices.Contains(PagesNew, href)
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
	// Group order is the reference's root meta.json tree order: components
	// first, then the (root) Get Started folder, then utils and registry
	// (react, helpers and forms have no templUI pages yet).
	{
		Title: "Components",
		Links: loadComponentsFromRegistry(),
	},
	// "Get Started" is their root folder title (content/docs/(root)/meta.json);
	// like the reference, the group repeats pages the Sections list also has
	// (Installation, Theming, Typeset, CLI) and hides Introduction and
	// Changelog via ExcludedSidebarPages.
	{
		Title: "Get Started",
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
	// templUI extra, deliberately its own section at the bottom: the import
	// workflow lives outside the shadcn-parity chapters.
	{
		Title: "Go Module",
		Links: []SideLink{
			{
				Text: "Import Workflow",
				Href: "/docs/import-workflow",
			},
		},
	},
}
