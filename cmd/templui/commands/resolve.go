// resolve.go ports src/preset/resolve.ts: reconstruct the preset of a
// project from components.json and the Tailwind entry file.
//
// Dropped npm-only parts: the next/font layout parsing (ts-morph over
// layout.tsx; templ layouts have no equivalent convention) — fonts resolve
// from the CSS variables and fontsource-style imports only.
package commands

import (
	"regexp"
	"strings"

	"github.com/templui/templui/cmd/templui/utils"
	"github.com/templui/templui/cmd/templui/utils/updaters"
	"github.com/templui/templui/internal/preset"
)

// ResolvedPreset is the resolveProjectPreset return shape.
type ResolvedPreset struct {
	Code      string
	Fallbacks []string
	Values    preset.Config
}

var serifFonts = map[string]bool{
	"eb-garamond": true, "instrument-serif": true, "lora": true,
	"merriweather": true, "playfair-display": true, "noto-serif": true,
	"roboto-slab": true,
}

var monoFonts = map[string]bool{"jetbrains-mono": true, "geist-mono": true}

var rootFontVariables = []string{"--font-sans", "--font-serif", "--font-mono"}

var radiusMap = map[string]string{
	"0":        "none",
	"0rem":     "none",
	"0.45rem":  "small",
	"0.625rem": "default",
	"0.875rem": "large",
}

// resolveProjectPreset is the resolveProjectPreset pendant.
func resolveProjectPreset(config *utils.Config) ResolvedPreset {
	_, styleName := preset.ParsePresetStyle(config.Style)
	defaults, ok := defaultPresets[styleName]
	if !ok {
		return ResolvedPreset{}
	}

	state := updaters.ExtractCSSStateFromFile(config.ResolvedPaths.TailwindCSS)

	baseColor := asPresetValue(preset.BaseColors, config.Tailwind.BaseColor)
	theme := matchTheme(state)
	chartColor := matchChartColor(state)
	iconLibrary := asPresetValue(preset.IconLibraries, config.IconLibrary)
	resolvedFont := resolveBodyFont(state)
	font := resolvedFont
	if font == "" {
		font = defaults.Font
	}
	resolvedFontHeading := resolveHeadingFont(state, font)
	fontHeading := resolvedFontHeading
	if fontHeading == "" {
		fontHeading = defaults.FontHeading
	}
	fontHeading = normalizeFontHeading(fontHeading, font, defaults.FontHeading)
	radius := radiusMap[normalizeCSSValue(state.RootVars["--radius"])]
	menuAccent := asPresetValue(preset.MenuAccents, config.MenuAccent)
	menuColor := asPresetValue(preset.MenuColors, config.MenuColor)

	values := preset.Config{
		Style:       styleName,
		BaseColor:   fallback(baseColor, defaults.BaseColor),
		Theme:       fallback(theme, defaults.Theme),
		ChartColor:  fallback(chartColor, defaults.ChartColor),
		IconLibrary: fallback(iconLibrary, defaults.IconLibrary),
		Font:        font,
		FontHeading: fontHeading,
		Radius:      fallback(radius, defaults.Radius),
		MenuAccent:  fallback(menuAccent, defaults.MenuAccent),
		MenuColor:   fallback(menuColor, defaults.MenuColor),
	}

	var fallbacks []string
	for _, entry := range [][2]string{
		{"baseColor", baseColor},
		{"theme", theme},
		{"chartColor", chartColor},
		{"iconLibrary", iconLibrary},
		{"font", resolvedFont},
		{"fontHeading", resolvedFontHeading},
		{"radius", radius},
		{"menuAccent", menuAccent},
		{"menuColor", menuColor},
	} {
		if entry[1] == "" {
			fallbacks = append(fallbacks, entry[0])
		}
	}

	return ResolvedPreset{
		Code:      preset.EncodePreset(values),
		Fallbacks: fallbacks,
		Values:    values,
	}
}

func fallback(value, def string) string {
	if value == "" {
		return def
	}
	return value
}

func asPresetValue(allowed []string, value string) string {
	for _, v := range allowed {
		if v == value {
			return value
		}
	}
	return ""
}

// matchTheme is the matchTheme pendant: --primary must map to the same
// preset theme family in light and dark.
func matchTheme(state updaters.CSSState) string {
	lightTheme := matchPresetThemeValue(state.RootVars["--primary"])
	if lightTheme == "" {
		return ""
	}
	darkPrimary := state.DarkVars["--primary"]
	if darkPrimary == "" {
		return lightTheme
	}
	if matchPresetThemeValue(darkPrimary) == lightTheme {
		return lightTheme
	}
	return ""
}

// matchChartColor is the matchChartColor pendant over --chart-1.
func matchChartColor(state updaters.CSSState) string {
	lightChartColor := matchPresetThemeValue(state.RootVars["--chart-1"])
	if lightChartColor == "" {
		return ""
	}
	darkValue := state.DarkVars["--chart-1"]
	if darkValue == "" {
		return lightChartColor
	}
	if matchPresetThemeValue(darkValue) == lightChartColor {
		return lightChartColor
	}
	return ""
}

func matchPresetThemeValue(value string) string {
	family := findTailwindColorFamily(value)
	return asPresetValue(preset.Themes, family)
}

// resolveBodyFont is the resolveBodyFont pendant (CSS variables, then
// fontsource-style imports).
func resolveBodyFont(state updaters.CSSState) string {
	for _, variable := range rootFontVariables {
		if matched := matchFontFromVariable(state, variable); matched != "" {
			return matched
		}
	}
	for _, variable := range rootFontVariables {
		if imported := matchFontByImports(state.Imports, variable); imported != "" {
			return imported
		}
	}
	return ""
}

// resolveHeadingFont is the resolveHeadingFont pendant without the next/font
// state.
func resolveHeadingFont(state updaters.CSSState, bodyFont string) string {
	if resolved := resolveFontValue(state, "--font-heading", map[string]bool{}); resolved != "" {
		if matched := parseFontFromFamily(resolved); matched != "" {
			if matched == bodyFont {
				return "inherit"
			}
			return matched
		}
	}

	value := cssVariableValue(state, "--font-heading")
	if value == "" {
		return ""
	}

	if reference := varReference(value); reference != "" {
		for _, rootVariable := range rootFontVariables {
			if reference == rootVariable {
				rootFont := matchFontFromVariable(state, reference)
				if rootFont == "" || rootFont == bodyFont {
					return "inherit"
				}
				return rootFont
			}
		}
	}

	return ""
}

// normalizeFontHeading is the normalizeFontHeading pendant.
func normalizeFontHeading(fontHeading, bodyFont, def string) string {
	if fontHeading == bodyFont {
		fontHeading = "inherit"
	}
	if asPresetValue(preset.FontHeadings, fontHeading) == "" {
		return def
	}
	return fontHeading
}

// resolveFontValue follows var() references between the font variables.
func resolveFontValue(state updaters.CSSState, variable string, seen map[string]bool) string {
	if seen[variable] {
		return ""
	}
	seen[variable] = true

	value := cssVariableValue(state, variable)
	if value == "" {
		return ""
	}

	reference := varReference(value)
	if reference == "" {
		return value
	}
	if isFontVariable(reference) {
		return resolveFontValue(state, reference, seen)
	}
	return ""
}

func isFontVariable(variable string) bool {
	if variable == "--font-heading" {
		return true
	}
	for _, v := range rootFontVariables {
		if v == variable {
			return true
		}
	}
	return false
}

// cssVariableValue is the getCssVariableValue pendant: @theme wins unless it
// is a self reference.
func cssVariableValue(state updaters.CSSState, variable string) string {
	if themeValue := state.ThemeVars[variable]; themeValue != "" && varReference(themeValue) != variable {
		return themeValue
	}
	if rootValue := state.RootVars[variable]; rootValue != "" {
		return rootValue
	}
	return state.ThemeVars[variable]
}

var varReferenceRe = regexp.MustCompile(`^var\((--[a-z0-9-]+)\)$`)

func varReference(value string) string {
	if m := varReferenceRe.FindStringSubmatch(normalizeCSSValue(value)); m != nil {
		return m[1]
	}
	return ""
}

func matchFontFromVariable(state updaters.CSSState, variable string) string {
	if resolved := resolveFontValue(state, variable, map[string]bool{}); resolved != "" {
		return parseFontFromFamily(resolved)
	}
	return ""
}

// matchFontByImports is the matchFontByImports pendant over
// @fontsource-variable imports.
func matchFontByImports(imports []string, variable string) string {
	var matches []string
	for _, source := range imports {
		font := parseFontFromDependency(source)
		if font != "" && fontVariable(font) == variable {
			matches = append(matches, font)
		}
	}
	if len(matches) == 1 {
		return matches[0]
	}
	return ""
}

// parseFontFromFamily is the parseFontFromFamily pendant: primary family,
// " Variable" suffix stripped, spaces to dashes.
func parseFontFromFamily(value string) string {
	primary := strings.TrimSpace(strings.SplitN(value, ",", 2)[0])
	primary = strings.Trim(primary, `"'`)
	primary = strings.TrimSpace(variableSuffixRe.ReplaceAllString(primary, ""))
	if primary == "" {
		return ""
	}
	return toPresetFont(strings.ReplaceAll(primary, " ", "-"))
}

var variableSuffixRe = regexp.MustCompile(`(?i)\s+variable$`)

// parseFontFromDependency is the parseFontFromDependency pendant.
func parseFontFromDependency(value string) string {
	normalized := normalizeCSSValue(value)
	after, ok := strings.CutPrefix(normalized, "@fontsource-variable/")
	if !ok {
		return ""
	}
	return toPresetFont(after)
}

func toPresetFont(value string) string {
	return asPresetValue(preset.Fonts, normalizeCSSValue(value))
}

// fontVariable is the getFontVariable pendant.
func fontVariable(font string) string {
	if monoFonts[font] {
		return "--font-mono"
	}
	if serifFonts[font] {
		return "--font-serif"
	}
	return "--font-sans"
}

var multiSpaceRe = regexp.MustCompile(`\s+`)
var commaSpaceRe = regexp.MustCompile(`\s*,\s*`)

// normalizeCSSValue is the normalizeCssValue pendant.
func normalizeCSSValue(value string) string {
	value = strings.TrimSpace(value)
	value = multiSpaceRe.ReplaceAllString(value, " ")
	value = commaSpaceRe.ReplaceAllString(value, ", ")
	value = strings.ReplaceAll(value, `"`, "'")
	return strings.ToLower(value)
}
