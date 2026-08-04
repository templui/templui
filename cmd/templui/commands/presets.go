// Package commands is the pendant of shadcn/src/commands: one file per CLI
// command plus the preset helpers they compose. presets.go ports
// src/preset/presets.ts and src/preset/defaults.ts: the named default
// presets and the /init URL builder.
package commands

import (
	"net/url"
	"strconv"

	"github.com/templui/templui/cmd/templui/registry"
	"github.com/templui/templui/internal/preset"
)

// DefaultPreset is a DEFAULT_PRESETS entry.
type DefaultPreset struct {
	Title       string
	Description string
	preset.Config
}

// defaultPresetNames keeps the DEFAULT_PRESETS iteration order.
var defaultPresetNames = []string{"nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"}

func standardPreset(style, iconLibrary, font string) preset.Config {
	return preset.Config{
		Style:       style,
		BaseColor:   "neutral",
		Theme:       "neutral",
		ChartColor:  "neutral",
		IconLibrary: iconLibrary,
		Font:        font,
		FontHeading: "inherit",
		MenuAccent:  "subtle",
		MenuColor:   "default",
		Radius:      "default",
	}
}

// defaultPresets is the DEFAULT_PRESETS pendant.
var defaultPresets = map[string]DefaultPreset{
	"nova": {"Nova", "Lucide / Geist", standardPreset("nova", "lucide", "geist")},
	"vega": {"Vega", "Lucide / Inter", standardPreset("vega", "lucide", "inter")},
	"maia": {"Maia", "Hugeicons / Figtree", standardPreset("maia", "hugeicons", "figtree")},
	"lyra": {"Lyra", "Phosphor / JetBrains Mono", standardPreset("lyra", "phosphor", "jetbrains-mono")},
	"mira": {"Mira", "Hugeicons / Inter", standardPreset("mira", "hugeicons", "inter")},
	"luma": {"Luma", "Lucide / Inter", standardPreset("luma", "lucide", "inter")},
	"sera": {"Sera", "Lucide / Noto Sans + Playfair Display", preset.Config{
		Style:       "sera",
		BaseColor:   "taupe",
		Theme:       "taupe",
		ChartColor:  "taupe",
		IconLibrary: "lucide",
		Font:        "noto-sans",
		FontHeading: "playfair-display",
		MenuAccent:  "subtle",
		MenuColor:   "default",
		Radius:      "default",
	}},
	"rhea": {"Rhea", "Lucide / Inter", standardPreset("rhea", "lucide", "inter")},
}

// initURLOptions are the resolveInitUrl options the templui CLI uses. The
// npm-only template option (next/vite/laravel scaffolds) has no Go pendant
// and is dropped.
type initURLOptions struct {
	preset string
	only   string
}

// resolveInitURL is the resolveInitUrl pendant, pointed at the configured
// registry instead of SHADCN_URL. The track param is dropped: the templui
// /init route has no usage tracking.
func resolveInitURL(registryURL string, config preset.Config, rtl bool, options initURLOptions) string {
	params := url.Values{}
	// templui ships a single component implementation, so base is always
	// "base" (shadcn: base | radix | aria).
	params.Set("base", "base")
	params.Set("style", config.Style)
	params.Set("baseColor", config.BaseColor)
	params.Set("theme", config.Theme)
	params.Set("iconLibrary", config.IconLibrary)
	params.Set("font", config.Font)
	params.Set("rtl", strconv.FormatBool(rtl))
	params.Set("menuAccent", config.MenuAccent)
	params.Set("menuColor", config.MenuColor)
	params.Set("radius", config.Radius)

	if config.ChartColor != "" && config.ChartColor != "neutral" {
		params.Set("chartColor", config.ChartColor)
	}
	if config.FontHeading != "" && config.FontHeading != "inherit" {
		params.Set("fontHeading", config.FontHeading)
	}
	// Pass the original preset code so the server can apply version-specific
	// backward-compat fixups.
	if options.preset != "" {
		params.Set("preset", options.preset)
	}
	if options.only != "" {
		params.Set("only", options.only)
	}

	return registryURL + "/init?" + params.Encode()
}

// resolvePresetInitURL turns a --preset value (code, URL or default preset
// name) into the /init URL. It mirrors the preset branches of init.ts.
func resolvePresetInitURL(registryURL, presetArg string, rtl bool, only string) (string, error) {
	if registry.IsURL(presetArg) {
		u, err := url.Parse(presetArg)
		if err != nil {
			return "", err
		}
		query := u.Query()
		query.Set("base", "base")
		query.Set("rtl", strconv.FormatBool(rtl))
		if only != "" {
			query.Set("only", only)
		}
		u.RawQuery = query.Encode()
		return u.String(), nil
	}

	if preset.IsPresetCode(presetArg) {
		decoded, ok := preset.DecodePreset(presetArg)
		if !ok {
			return "", &invalidPresetCodeError{code: presetArg}
		}
		return resolveInitURL(registryURL, decoded, rtl, initURLOptions{preset: presetArg, only: only}), nil
	}

	if named, ok := defaultPresets[presetArg]; ok {
		return resolveInitURL(registryURL, named.Config, rtl, initURLOptions{only: only}), nil
	}

	return "", &unknownPresetError{name: presetArg}
}

type invalidPresetCodeError struct{ code string }

func (e *invalidPresetCodeError) Error() string {
	return "Invalid preset code: " + e.code
}

type unknownPresetError struct{ name string }

func (e *unknownPresetError) Error() string {
	names := ""
	for i, name := range defaultPresetNames {
		if i > 0 {
			names += ", "
		}
		names += name
	}
	return "Invalid preset: " + e.name + ". Use a preset code, a URL or one of: " + names +
		"\nor build your own at " + registry.SiteURL + "/create"
}
