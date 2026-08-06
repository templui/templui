// The preset command, the pendant of src/commands/preset.ts: decode a preset
// code, resolve the preset of the current project, or print the create URL
// for a code. The codec itself is the shared internal/preset package.
//
// Dropped npm-only subcommand: open (opens the browser; the url subcommand
// prints the same URL).
package commands

import (
	"encoding/json"
	"flag"
	"fmt"
	"path/filepath"

	"github.com/axadrn/shadcn-templ/v2/cmd/templui/registry"
	"github.com/axadrn/shadcn-templ/v2/cmd/templui/utils"
	"github.com/axadrn/shadcn-templ/v2/internal/preset"
)

// PresetDecodeResult is the decodePresetCode return shape.
type PresetDecodeResult struct {
	Code    string        `json:"code"`
	Version string        `json:"version"`
	Values  preset.Config `json:"values"`
	Derived []string      `json:"derived"`
	URL     string        `json:"url"`
}

// presetURL is the getPresetUrl pendant.
func presetURL(code string) string {
	return registry.SiteURL + "/create?preset=" + code
}

// decodePresetCode is the decodePresetCode pendant: decode and fill the
// chartColor compatibility fallback of v1 codes.
func decodePresetCode(code string) (PresetDecodeResult, error) {
	decoded, ok := preset.DecodePreset(code)
	if !ok {
		return PresetDecodeResult{}, fmt.Errorf("invalid preset code: %s", code)
	}

	var derived []string
	if decoded.ChartColor == "" {
		if mapped, ok := preset.V1ChartColorMap[decoded.Theme]; ok {
			decoded.ChartColor = mapped
		} else {
			decoded.ChartColor = decoded.Theme
		}
		derived = append(derived, "chartColor")
	}

	return PresetDecodeResult{
		Code:    code,
		Version: code[:1],
		Values:  decoded,
		Derived: derived,
		URL:     presetURL(code),
	}, nil
}

// printEntries is the printEntries pendant: aligned key/value pairs.
func printEntries(entries [][2]string) {
	maxKey := 0
	for _, entry := range entries {
		maxKey = max(maxKey, len(entry[0]))
	}
	for _, entry := range entries {
		fmt.Printf("  %-*s%s\n", maxKey+2, entry[0], entry[1])
	}
}

// printPresetInfo is the printPresetInfo pendant.
func printPresetInfo(code string, values preset.Config, fallbacks []string, fallbackNote string) {
	fmt.Println("Preset")
	if code == "" {
		printEntries([][2]string{{"code", "-"}})
		return
	}

	inFallbacks := func(key string) bool {
		for _, f := range fallbacks {
			if f == key {
				return true
			}
		}
		return false
	}
	format := func(key, value string) string {
		if value == "" {
			value = "-"
		}
		if inFallbacks(key) {
			value += "*"
		}
		return value
	}

	printEntries([][2]string{
		{"code", code},
		{"version", code[:1]},
		{"style", values.Style},
		{"baseColor", format("baseColor", values.BaseColor)},
		{"theme", format("theme", values.Theme)},
		{"chartColor", format("chartColor", values.ChartColor)},
		{"iconLibrary", format("iconLibrary", values.IconLibrary)},
		{"font", format("font", values.Font)},
		{"fontHeading", format("fontHeading", values.FontHeading)},
		{"radius", format("radius", values.Radius)},
		{"menuAccent", format("menuAccent", values.MenuAccent)},
		{"menuColor", format("menuColor", values.MenuColor)},
		{"url", presetURL(code)},
	})

	if len(fallbacks) > 0 {
		fmt.Println()
		fmt.Println(fallbackNote)
	}
}

// presetConfigJSON serializes a preset.Config with the reference key names.
func presetConfigJSON(values preset.Config) map[string]string {
	return map[string]string{
		"style":       values.Style,
		"baseColor":   values.BaseColor,
		"theme":       values.Theme,
		"chartColor":  values.ChartColor,
		"iconLibrary": values.IconLibrary,
		"font":        values.Font,
		"fontHeading": values.FontHeading,
		"radius":      values.Radius,
		"menuAccent":  values.MenuAccent,
		"menuColor":   values.MenuColor,
	}
}

func printJSON(v any) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	fmt.Println(string(data))
	return nil
}

// RunPresetDecode executes templui preset decode <code>.
func RunPresetDecode(code string, jsonOut bool) error {
	result, err := decodePresetCode(code)
	if err != nil {
		return err
	}

	if jsonOut {
		return printJSON(map[string]any{
			"code":    result.Code,
			"version": result.Version,
			"values":  presetConfigJSON(result.Values),
			"derived": append([]string{}, result.Derived...),
			"url":     result.URL,
		})
	}

	printPresetInfo(result.Code, result.Values, result.Derived, "  * Compatibility value for older preset versions.")
	return nil
}

// RunPresetURL executes templui preset url <code>.
func RunPresetURL(code string) error {
	result, err := decodePresetCode(code)
	if err != nil {
		return err
	}
	fmt.Println(result.URL)
	return nil
}

// PresetResolveOptions are the flags of templui preset resolve.
type PresetResolveOptions struct {
	Cwd  string
	JSON bool
}

// NewPresetResolveFlagSet declares the preset resolve flags.
func NewPresetResolveFlagSet(opts *PresetResolveOptions) *flag.FlagSet {
	fs := flag.NewFlagSet("preset resolve", flag.ContinueOnError)
	fs.BoolVar(&opts.JSON, "json", false, "output as JSON")
	fs.StringVar(&opts.Cwd, "cwd", ".", "the working directory")
	fs.StringVar(&opts.Cwd, "c", ".", "shorthand for --cwd")
	return fs
}

// RunPresetResolve executes templui preset resolve.
func RunPresetResolve(opts PresetResolveOptions) error {
	cwd, err := filepath.Abs(opts.Cwd)
	if err != nil {
		return err
	}

	config, err := utils.GetConfig(cwd)
	if err != nil {
		return err
	}
	if config == nil {
		if opts.JSON {
			fmt.Println("null")
			return nil
		}
		fmt.Println("No components.json found.")
		return nil
	}

	resolved := resolveProjectPreset(config)

	if opts.JSON {
		if resolved.Code == "" {
			fmt.Println("null")
			return nil
		}
		return printJSON(map[string]any{
			"code":      resolved.Code,
			"fallbacks": append([]string{}, resolved.Fallbacks...),
			"values":    presetConfigJSON(resolved.Values),
		})
	}

	printPresetInfo(resolved.Code, resolved.Values, resolved.Fallbacks,
		"  * Uses preset defaults for values not available as options on "+registry.SiteURL+"/create.")
	return nil
}
