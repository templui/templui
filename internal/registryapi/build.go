// Registry item builders, the pendant of apps/v4/registry/config.ts
// (buildRegistryTheme, buildThemeForPreset, buildRegistryBase,
// buildPartialRegistryBase).
//
// Field mapping where the npm original has no templui pendant (the
// registryItemSchema field names are kept):
//
//	dependencies:            npm packages -> the Go module. shadcn@latest
//	                         becomes github.com/templui/templui@latest; the
//	                         class-variance-authority, @base-ui/react and
//	                         icon packages have no pendant (variants, DOM
//	                         behavior and lucide icons are compiled into the
//	                         module) and tw-animate-css ships as a vendored
//	                         stylesheet, so none of them appear.
//	css @imports:            "tw-animate-css" and "shadcn/tailwind.css" are
//	                         npm exports; the pendants are the vendored
//	                         files ./tw-animate.css and ./shadcn-tailwind.css
//	                         next to the consumer's Tailwind entry file.
//	registryDependencies:    kept 1:1 ("utils", "font-<x>",
//	                         "font-heading-<x>") — they name registry items,
//	                         not packages.
//	docs (rtl):              dropped; templui has no per-template RTL setup
//	                         pages (shadcn links /docs/rtl/<template>).
//	devDependencies (index): dropped; tw-animate-css and the shadcn CLI are
//	                         npm-only concepts.
package registryapi

import "fmt"

// moduleVersion is the SHADCN_VERSION pendant for the Go module dependency.
const moduleVersion = "latest"

// ModuleDependency is the Go pendant of the shadcn@latest npm dependency.
const ModuleDependency = "github.com/templui/templui@" + moduleVersion

// Item is the registryItemSchema pendant. The field order matches the JSON
// key order of the live ui.shadcn.com routes ($schema, extends, name,
// dependencies, devDependencies, registryDependencies, files, cssVars, css,
// meta, type, config).
type Item struct {
	Schema               string      `json:"$schema,omitempty"`
	Extends              string      `json:"extends,omitempty"`
	Name                 string      `json:"name"`
	Dependencies         []string    `json:"dependencies,omitempty"`
	DevDependencies      []string    `json:"devDependencies,omitempty"`
	RegistryDependencies []string    `json:"registryDependencies,omitempty"`
	Files                []ItemFile  `json:"files,omitzero"`
	CSSVars              *ItemVars   `json:"cssVars,omitempty"`
	CSS                  *CSS        `json:"css,omitempty"`
	Meta                 *ItemMeta   `json:"meta,omitempty"`
	Type                 string      `json:"type"`
	Config               *ItemConfig `json:"config,omitempty"`
}

// ItemFile field order follows the live files[] entries (path, content,
// type). target is omitted like in the golden output; the templui CLI
// derives the install path from path and its own components dir config.
type ItemFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
	Type    string `json:"type"`
}

type ItemVars struct {
	Theme *Vars `json:"theme,omitempty"`
	Light *Vars `json:"light,omitempty"`
	Dark  *Vars `json:"dark,omitempty"`
}

type ItemMeta struct {
	Links ItemLinks `json:"links"`
}

// ItemLinks keeps only docs; shadcn's examples/api links point at tsx
// example sources and base-ui API docs that have no templui pendant.
type ItemLinks struct {
	Docs string `json:"docs"`
}

// ItemConfig covers both the full config block of the base item and the
// partial one of ?only=; field order matches the live output (style,
// tailwind, iconLibrary, rtl, menuColor, menuAccent).
type ItemConfig struct {
	Style       string          `json:"style,omitempty"`
	Tailwind    *TailwindConfig `json:"tailwind,omitempty"`
	IconLibrary string          `json:"iconLibrary,omitempty"`
	RTL         *bool           `json:"rtl,omitempty"`
	MenuColor   string          `json:"menuColor,omitempty"`
	MenuAccent  string          `json:"menuAccent,omitempty"`
}

type TailwindConfig struct {
	BaseColor string `json:"baseColor,omitempty"`
}

// RegistryTheme is the buildRegistryTheme return value.
type RegistryTheme struct {
	Name  string
	Type  string
	Theme *Vars // nil when empty (the themeVars undefined case)
	Light *Vars
	Dark  *Vars
}

// BuildRegistryTheme is the buildRegistryTheme pendant: merge base color and
// theme CSS vars, overlay the chart color's chart-1..5, apply the bold menu
// accent (accent := primary) and a non-default radius.
func BuildRegistryTheme(config DesignSystemConfig) (RegistryTheme, error) {
	baseColor := GetBaseColor(config.BaseColor)
	theme := GetTheme(config.Theme)
	if baseColor == nil || theme == nil {
		return RegistryTheme{}, fmt.Errorf(`Base color "%s" or theme "%s" not found`, config.BaseColor, config.Theme)
	}

	// Merge base color and theme CSS vars.
	lightVars := baseColor.CSSVars.Light.Merge(theme.CSSVars.Light)
	darkVars := baseColor.CSSVars.Dark.Merge(theme.CSSVars.Dark)

	// Apply chart color override.
	if chartTheme := GetTheme(config.ChartColor); chartTheme != nil {
		for i := 1; i <= 5; i++ {
			key := fmt.Sprintf("chart-%d", i)
			if v, ok := chartTheme.CSSVars.Light.Get(key); ok {
				lightVars.Set(key, v)
			}
			if v, ok := chartTheme.CSSVars.Dark.Get(key); ok {
				darkVars.Set(key, v)
			}
		}
	}

	// Apply menu accent transformation.
	if config.MenuAccent == "bold" {
		copyVar(lightVars, "primary", "accent")
		copyVar(lightVars, "primary-foreground", "accent-foreground")
		copyVar(darkVars, "primary", "accent")
		copyVar(darkVars, "primary-foreground", "accent-foreground")
	}

	// Apply radius transformation.
	if config.Radius != "" && config.Radius != "default" {
		if radius := getRadius(config.Radius); radius != nil && radius.Value != "" {
			lightVars.Set("radius", radius.Value)
		}
	}

	return RegistryTheme{
		Name:  config.BaseColor + "-" + config.Theme,
		Type:  "registry:theme",
		Light: lightVars,
		Dark:  darkVars,
	}, nil
}

// BuildThemeForPreset is the buildThemeForPreset pendant: the standalone
// registry:theme item with the radius resolved into light.radius.
func BuildThemeForPreset(config DesignSystemConfig) (Item, error) {
	registryTheme, err := BuildRegistryTheme(config)
	if err != nil {
		return Item{}, err
	}

	radiusValue := ""
	if config.Radius == "default" {
		if v, ok := registryTheme.Light.Get("radius"); ok {
			radiusValue = v
		} else {
			radiusValue = DefaultRadiusValue
		}
	} else if radius := getRadius(config.Radius); radius != nil {
		radiusValue = radius.Value
	} else if v, ok := registryTheme.Light.Get("radius"); ok {
		radiusValue = v
	}

	light := registryTheme.Light.Clone()
	if radiusValue != "" {
		light.Set("radius", radiusValue)
	}

	return Item{
		Schema: SiteURL + "/schema/registry-item.json",
		Name:   registryTheme.Name,
		Type:   "registry:theme",
		CSSVars: &ItemVars{
			Theme: registryTheme.Theme,
			Light: light,
			Dark:  registryTheme.Dark,
		},
	}, nil
}

// baseCSS is the css block of the base item: the vendored pendants of
// shadcn's tw-animate-css and shadcn/tailwind.css npm imports plus the
// @layer base rules, and the optional pointer cursor rule.
func baseCSS(pointer bool) *CSS {
	layerBase := NewCSS().
		Set("*", NewCSS().Set("@apply border-border outline-ring/50", NewCSS())).
		Set("body", NewCSS().Set("@apply bg-background text-foreground", NewCSS()))
	if pointer {
		layerBase.Set(PointerCursorSelector, NewCSS().Set("cursor", "pointer"))
	}
	return NewCSS().
		Set(`@import "./tw-animate.css"`, NewCSS()).
		Set(`@import "./shadcn-tailwind.css"`, NewCSS()).
		Set("@layer base", layerBase)
}

// BuildRegistryBase is the buildRegistryBase pendant: the registry:base item
// of /init.
func BuildRegistryBase(config DesignSystemConfig) (Item, error) {
	normalizedFontHeading := config.FontHeading
	if normalizedFontHeading == config.Font {
		normalizedFontHeading = "inherit"
	}

	registryTheme, err := BuildRegistryTheme(config)
	if err != nil {
		return Item{}, err
	}

	// Build dependencies. The npm list (shadcn@latest,
	// class-variance-authority, tw-animate-css, base deps, icon packages)
	// collapses to the Go module; see the package comment.
	dependencies := []string{ModuleDependency}

	registryDependencies := []string{"utils"}

	themeVars := registryTheme.Theme.Clone()
	if normalizedFontHeading == "inherit" {
		themeVars.Set("--font-heading", GetInheritedHeadingFontValue(config.Font))
	}

	if config.Font != "" {
		registryDependencies = append(registryDependencies, "font-"+config.Font)
	}
	if normalizedFontHeading != "inherit" {
		registryDependencies = append(registryDependencies, "font-heading-"+normalizedFontHeading)
	}

	cssVars := &ItemVars{
		Light: registryTheme.Light,
		Dark:  registryTheme.Dark,
	}
	if themeVars.Len() > 0 {
		cssVars.Theme = themeVars
	}

	rtl := config.RTL
	return Item{
		Name:    config.Base + "-" + config.Style,
		Extends: "none",
		Type:    "registry:base",
		Config: &ItemConfig{
			Style:       config.Base + "-" + config.Style,
			IconLibrary: config.IconLibrary,
			RTL:         &rtl,
			MenuColor:   config.MenuColor,
			MenuAccent:  config.MenuAccent,
			Tailwind:    &TailwindConfig{BaseColor: config.BaseColor},
		},
		Dependencies:         dependencies,
		RegistryDependencies: registryDependencies,
		CSSVars:              cssVars,
		CSS:                  baseCSS(config.Pointer),
	}, nil
}

// BuildPartialRegistryBase is the buildPartialRegistryBase pendant for
// ?only=theme|font.
func BuildPartialRegistryBase(config DesignSystemConfig, parts []string) (Item, error) {
	uniqueParts := dedupe(parts)
	normalizedFontHeading := config.FontHeading
	if normalizedFontHeading == config.Font {
		normalizedFontHeading = "inherit"
	}

	var partialConfig *ItemConfig
	var registryDependencies []string
	cssVars := &ItemVars{}

	if contains(uniqueParts, "theme") {
		registryTheme, err := BuildRegistryTheme(config)
		if err != nil {
			return Item{}, err
		}

		partialConfig = &ItemConfig{
			MenuColor:  config.MenuColor,
			MenuAccent: config.MenuAccent,
			Tailwind:   &TailwindConfig{BaseColor: config.BaseColor},
		}

		if registryTheme.Theme.Len() > 0 {
			cssVars.Theme = registryTheme.Theme.Clone()
		}
		cssVars.Light = registryTheme.Light
		cssVars.Dark = registryTheme.Dark
	}

	if contains(uniqueParts, "font") {
		registryDependencies = append(registryDependencies, "font-"+config.Font)

		if normalizedFontHeading != "inherit" {
			registryDependencies = append(registryDependencies, "font-heading-"+normalizedFontHeading)
		} else {
			if cssVars.Theme == nil {
				cssVars.Theme = NewVars()
			}
			cssVars.Theme.Set("--font-heading", GetInheritedHeadingFontValue(config.Font))
		}
	}

	item := Item{
		Name:                 config.Base + "-" + config.Style + "-" + joinParts(uniqueParts),
		Extends:              "none",
		Type:                 "registry:base",
		Config:               partialConfig,
		RegistryDependencies: registryDependencies,
	}
	if cssVars.Theme.Len() > 0 || cssVars.Light.Len() > 0 || cssVars.Dark.Len() > 0 {
		item.CSSVars = cssVars
	}
	return item, nil
}

func copyVar(vars *Vars, from, to string) {
	if v, ok := vars.Get(from); ok {
		vars.Set(to, v)
	}
}

func dedupe(values []string) []string {
	var out []string
	for _, v := range values {
		if !contains(out, v) {
			out = append(out, v)
		}
	}
	return out
}

func joinParts(parts []string) string {
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += "-"
		}
		out += p
	}
	return out
}
