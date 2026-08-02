// Design system config parsing and validation, the pendant of
// apps/v4/registry/config.ts (designSystemConfigSchema, RADII, fonts) plus
// app/(app)/(create)/lib/parse-config.ts and lib/preset-query.ts.
//
// Deliberate differences from the npm original, all documented inline:
//   - BASES is ["base"]: templUI has exactly one Go implementation of every
//     component, so the radix/aria bases of shadcn have no pendant here.
//   - template is ignored: shadcn's next/vite/laravel app templates have no
//     templUI pendant (a consumer project is any Go module).
//   - item (the preview item name of the /create UI) is not part of the
//     config; no build function reads it.
package registryapi

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/templui/templui/internal/preset"
)

const DefaultRadiusValue = "0.625rem"

// PointerCursorSelector is the POINTER_CURSOR_SELECTOR pendant.
const PointerCursorSelector = `button:not(:disabled), [role="button"]:not(:disabled)`

// Bases: templUI ships one implementation, so only "base" exists (shadcn:
// base | aria | radix).
var Bases = []string{"base"}

// Styles in registry/styles.tsx order (also the /init enum error order).
var Styles = []string{"vega", "nova", "maia", "lyra", "mira", "luma", "sera", "rhea"}

// IconLibraryNames in shadcn/icons iconLibraries key order. templUI compiles
// lucide icons into the icon component; the other names are accepted for
// preset code parity but carry no package dependency (documented in
// BuildRegistryBase).
var IconLibraryNames = []string{"lucide", "tabler", "hugeicons", "phosphor", "remixicon"}

// fontVariables maps a font value to the CSS variable its @theme block
// defines, from lib/font-definitions.ts (vendored in create-config.js). The
// slice order is the bodyFonts order of registry/fonts.ts, which is what the
// fontValues enum derives from.
var fontDefs = []struct {
	Value    string
	Variable string
}{
	{"geist", "--font-sans"},
	{"inter", "--font-sans"},
	{"noto-sans", "--font-sans"},
	{"nunito-sans", "--font-sans"},
	{"figtree", "--font-sans"},
	{"roboto", "--font-sans"},
	{"raleway", "--font-sans"},
	{"dm-sans", "--font-sans"},
	{"public-sans", "--font-sans"},
	{"outfit", "--font-sans"},
	{"oxanium", "--font-sans"},
	{"manrope", "--font-sans"},
	{"space-grotesk", "--font-sans"},
	{"montserrat", "--font-sans"},
	{"ibm-plex-sans", "--font-sans"},
	{"source-sans-3", "--font-sans"},
	{"instrument-sans", "--font-sans"},
	{"geist-mono", "--font-mono"},
	{"jetbrains-mono", "--font-mono"},
	{"noto-serif", "--font-serif"},
	{"roboto-slab", "--font-serif"},
	{"merriweather", "--font-serif"},
	{"lora", "--font-serif"},
	{"playfair-display", "--font-serif"},
	{"eb-garamond", "--font-serif"},
	{"instrument-serif", "--font-serif"},
}

// FontValues is the fontValues pendant (bodyFonts names without the font-
// prefix).
var FontValues = func() []string {
	out := make([]string, len(fontDefs))
	for i, f := range fontDefs {
		out[i] = f.Value
	}
	return out
}()

// FontHeadingValues is the fontHeadingValues pendant.
var FontHeadingValues = append([]string{"inherit"}, FontValues...)

// GetInheritedHeadingFontValue is the getInheritedHeadingFontValue pendant:
// var(<the body font's CSS variable>), falling back to --font-sans.
func GetInheritedHeadingFontValue(font string) string {
	for _, f := range fontDefs {
		if f.Value == font {
			return "var(" + f.Variable + ")"
		}
	}
	return "var(--font-sans)"
}

// Radius is a RADII entry.
type Radius struct {
	Name  string
	Value string
}

// RADII from registry/config.ts.
var Radii = []Radius{
	{"default", ""},
	{"none", "0"},
	{"small", "0.45rem"},
	{"medium", "0.625rem"},
	{"large", "0.875rem"},
}

func radiusNames() []string {
	out := make([]string, len(Radii))
	for i, r := range Radii {
		out[i] = r.Name
	}
	return out
}

func getRadius(name string) *Radius {
	for i := range Radii {
		if Radii[i].Name == name {
			return &Radii[i]
		}
	}
	return nil
}

var MenuAccents = []string{"subtle", "bold"}
var MenuColors = []string{"default", "inverted", "default-translucent", "inverted-translucent"}

// DesignSystemConfig is the designSystemConfigSchema output pendant.
type DesignSystemConfig struct {
	Base        string
	Style       string
	IconLibrary string
	BaseColor   string
	Theme       string
	ChartColor  string
	Font        string
	FontHeading string
	RTL         bool
	Pointer     bool
	MenuAccent  string
	MenuColor   string
	Radius      string
}

// DefaultConfig is the DEFAULT_CONFIG pendant.
var DefaultConfig = DesignSystemConfig{
	Base:        "base",
	Style:       "nova",
	BaseColor:   "neutral",
	Theme:       "neutral",
	ChartColor:  "neutral",
	IconLibrary: "lucide",
	Font:        "inter",
	FontHeading: "inherit",
	MenuAccent:  "subtle",
	MenuColor:   "default",
	Radius:      "default",
}

func themeNames() []string {
	all := Themes()
	out := make([]string, len(all))
	for i, t := range all {
		out[i] = t.Name
	}
	return out
}

func baseColorEnum() []string {
	all := BaseColors()
	out := make([]string, len(all))
	for i, t := range all {
		out[i] = t.Name
	}
	return out
}

// enumValue validates a nullable enum input like a zod z.enum() field:
// nil without a default errors like invalid_type on null, an unknown value
// errors like invalid_enum_value. defaultValue "" means required.
func enumValue(value *string, allowed []string, defaultValue string) (string, error) {
	if value == nil {
		if defaultValue != "" {
			return defaultValue, nil
		}
		return "", fmt.Errorf("Expected %s, received null", enumList(allowed))
	}
	if !contains(allowed, *value) {
		return "", fmt.Errorf("Invalid enum value. Expected %s, received '%s'", enumList(allowed), *value)
	}
	return *value, nil
}

func enumList(values []string) string {
	quoted := make([]string, len(values))
	for i, v := range values {
		quoted[i] = "'" + v + "'"
	}
	return strings.Join(quoted, " | ")
}

func getParam(q url.Values, key string) *string {
	if !q.Has(key) {
		return nil
	}
	v := q.Get(key)
	return &v
}

// rawConfig is the pre-validation configInput of parse-config.ts. nil means
// the JS null/undefined.
type rawConfig struct {
	base        *string
	style       *string
	iconLibrary *string
	baseColor   *string
	theme       *string
	chartColor  *string
	font        *string
	fontHeading *string
	menuAccent  *string
	menuColor   *string
	radius      *string
	rtl         bool
	pointer     bool
}

// ParseDesignSystemConfig is the parseDesignSystemConfig pendant: build the
// raw config from a preset code or from individual params, then validate it
// with designSystemConfigSchema semantics. The returned error text is the
// first issue message, like result.error.issues[0].message.
func ParseDesignSystemConfig(q url.Values) (DesignSystemConfig, error) {
	var raw rawConfig

	if p := q.Get("preset"); p != "" && preset.IsPresetCode(p) {
		decoded, ok := preset.DecodePreset(p)
		if !ok {
			return DesignSystemConfig{}, fmt.Errorf("Invalid preset code")
		}
		fontHeading, chartColor := resolvePresetOverrides(q, decoded)
		base := "base"
		if v := getParam(q, "base"); v != nil {
			base = *v
		}
		raw = rawConfig{
			base:        &base,
			style:       &decoded.Style,
			iconLibrary: &decoded.IconLibrary,
			baseColor:   &decoded.BaseColor,
			theme:       &decoded.Theme,
			chartColor:  &chartColor,
			font:        &decoded.Font,
			fontHeading: &fontHeading,
			menuAccent:  &decoded.MenuAccent,
			menuColor:   &decoded.MenuColor,
			radius:      &decoded.Radius,
			rtl:         q.Get("rtl") == "true",
			pointer:     q.Get("pointer") == "true",
		}
	} else {
		raw = rawConfig{
			base:        getParam(q, "base"),
			style:       getParam(q, "style"),
			iconLibrary: getParam(q, "iconLibrary"),
			baseColor:   getParam(q, "baseColor"),
			theme:       getParam(q, "theme"),
			chartColor:  getParam(q, "chartColor"),
			font:        getParam(q, "font"),
			fontHeading: getParam(q, "fontHeading"),
			menuAccent:  getParam(q, "menuAccent"),
			menuColor:   getParam(q, "menuColor"),
			radius:      getParam(q, "radius"),
			rtl:         q.Get("rtl") == "true",
			pointer:     q.Get("pointer") == "true",
		}
	}

	return validateConfig(raw)
}

// resolvePresetOverrides is the lib/preset-query.ts pendant: query params may
// override the decoded fontHeading and chartColor, and v1 codes without a
// chartColor fall back to the V1 chart color map, then the theme.
func resolvePresetOverrides(q url.Values, decoded preset.Config) (fontHeading, chartColor string) {
	fontHeading = decoded.FontHeading
	if v := getParam(q, "fontHeading"); v != nil {
		fontHeading = *v
	}

	chartColor = decoded.ChartColor
	if chartColor == "" {
		if mapped, ok := preset.V1ChartColorMap[decoded.Theme]; ok {
			chartColor = mapped
		} else {
			chartColor = decoded.Theme
		}
	}
	if v := getParam(q, "chartColor"); v != nil {
		chartColor = *v
	}
	return fontHeading, chartColor
}

// validateConfig applies the designSystemConfigSchema field order, defaults,
// the chartColor ?? theme transform, and both refinements.
func validateConfig(raw rawConfig) (DesignSystemConfig, error) {
	var c DesignSystemConfig
	var err error

	if c.Base, err = enumValue(raw.base, Bases, ""); err != nil {
		return c, err
	}
	if c.Style, err = enumValue(raw.style, Styles, ""); err != nil {
		return c, err
	}
	if c.IconLibrary, err = enumValue(raw.iconLibrary, IconLibraryNames, ""); err != nil {
		return c, err
	}
	if c.BaseColor, err = enumValue(raw.baseColor, baseColorEnum(), "neutral"); err != nil {
		return c, err
	}
	if c.Theme, err = enumValue(raw.theme, themeNames(), ""); err != nil {
		return c, err
	}
	// chartColor is optional: nil stays empty until the transform below.
	if raw.chartColor != nil {
		if c.ChartColor, err = enumValue(raw.chartColor, themeNames(), ""); err != nil {
			return c, err
		}
	}
	if c.Font, err = enumValue(raw.font, FontValues, "inter"); err != nil {
		return c, err
	}
	if c.FontHeading, err = enumValue(raw.fontHeading, FontHeadingValues, "inherit"); err != nil {
		return c, err
	}
	c.RTL = raw.rtl
	c.Pointer = raw.pointer
	if c.MenuAccent, err = enumValue(raw.menuAccent, MenuAccents, "subtle"); err != nil {
		return c, err
	}
	if c.MenuColor, err = enumValue(raw.menuColor, MenuColors, "default"); err != nil {
		return c, err
	}
	if c.Radius, err = enumValue(raw.radius, radiusNames(), "default"); err != nil {
		return c, err
	}

	// .transform: chartColor defaults to the theme.
	if c.ChartColor == "" {
		c.ChartColor = c.Theme
	}

	// .refine: theme and chartColor must be available for the base color.
	if !themeAvailable(c.BaseColor, c.Theme) {
		return c, fmt.Errorf("Theme %q is not available for base color %q", c.Theme, c.BaseColor)
	}
	if !themeAvailable(c.BaseColor, c.ChartColor) {
		return c, fmt.Errorf("Chart color %q is not available for base color %q", c.ChartColor, c.BaseColor)
	}

	return c, nil
}

func themeAvailable(baseColor, theme string) bool {
	for _, t := range ThemesForBaseColor(baseColor) {
		if t.Name == theme {
			return true
		}
	}
	return false
}

// RegistryBaseParts are the ?only= values.
var RegistryBaseParts = []string{"theme", "font"}

// ParseRegistryBaseParts is the parseRegistryBaseParts pendant. A nil query
// value (parameter absent) returns nil parts.
func ParseRegistryBaseParts(value *string) ([]string, error) {
	if value == nil {
		return nil, nil
	}

	aliases := map[string]string{"theme": "theme", "font": "font", "fonts": "font"}
	var parts []string
	seen := map[string]bool{}
	invalid := false
	rawCount := 0
	for _, part := range strings.Split(*value, ",") {
		part = strings.ToLower(strings.TrimSpace(part))
		if part == "" {
			continue
		}
		rawCount++
		mapped, ok := aliases[part]
		if !ok {
			invalid = true
			continue
		}
		if !seen[mapped] {
			seen[mapped] = true
			parts = append(parts, mapped)
		}
	}

	if rawCount == 0 || invalid {
		return nil, fmt.Errorf("Invalid only value. Use one or more of: %s", strings.Join(RegistryBaseParts, ", "))
	}

	return parts, nil
}
