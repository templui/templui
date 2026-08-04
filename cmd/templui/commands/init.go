// The init command, the pendant of src/commands/init.ts reduced to the
// templui feature set: fetch the registry:base item for a preset (or the
// defaults), write components.json, merge the theme CSS into the user's
// Tailwind entry file and install the utils lib item.
//
// Dropped npm-only options, all without a Go pendant: --template (framework
// scaffolds), --base (component library selection; templui ships one
// implementation), --monorepo, --cssVariables/--rtl/--pointer toggles beyond
// what a preset encodes, --defaults/-y prompt shortcuts (this init does not
// prompt for design choices), and the interactive preset picker.
package commands

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/templui/templui/cmd/templui/registry"
	"github.com/templui/templui/cmd/templui/utils"
)

// InitOptions are the flags of templui init.
type InitOptions struct {
	Cwd       string
	Preset    string
	BaseColor string
	CSS       string
	Force     bool
	Silent    bool
	Registry  string
}

// NewInitFlagSet declares the init flags.
func NewInitFlagSet(opts *InitOptions) *flag.FlagSet {
	fs := flag.NewFlagSet("init", flag.ContinueOnError)
	fs.StringVar(&opts.Preset, "preset", "", "use a preset configuration (code, URL or name)")
	fs.StringVar(&opts.Preset, "p", "", "shorthand for --preset")
	fs.StringVar(&opts.BaseColor, "base-color", "", "override the base color")
	fs.StringVar(&opts.CSS, "css", "", "path to your Tailwind CSS entry file")
	fs.BoolVar(&opts.Force, "force", false, "force overwrite of existing configuration")
	fs.BoolVar(&opts.Force, "f", false, "shorthand for --force")
	fs.BoolVar(&opts.Silent, "silent", false, "mute output")
	fs.BoolVar(&opts.Silent, "s", false, "shorthand for --silent")
	fs.StringVar(&opts.Registry, "registry", "", "registry URL (default "+registry.DefaultRegistry+", env "+registry.EnvRegistry+")")
	fs.StringVar(&opts.Cwd, "cwd", ".", "the working directory")
	fs.StringVar(&opts.Cwd, "c", ".", "shorthand for --cwd")
	return fs
}

// RunInit executes templui init.
func RunInit(opts InitOptions) error {
	cwd, err := filepath.Abs(opts.Cwd)
	if err != nil {
		return err
	}
	registryURL := registry.Resolve(opts.Registry)

	// Preflight: a Go module is the templui pendant of a framework project.
	module, err := utils.ModulePath(cwd)
	if err != nil {
		return err
	}

	existing, err := utils.GetRawConfig(cwd)
	if err != nil {
		return err
	}
	if existing != nil && !opts.Force {
		if !confirm("A components.json file already exists. Would you like to overwrite it?") {
			fmt.Println("  To start over, remove the components.json file and run init again.")
			os.Exit(1)
		}
	}

	// Resolve the /init URL from --preset (code, URL or name); no preset
	// uses the nova defaults.
	presetArg := opts.Preset
	initURL := ""
	if presetArg == "" {
		initURL = resolveInitURL(registryURL, defaultPresets["nova"].Config, false, initURLOptions{})
	} else {
		initURL, err = resolvePresetInitURL(registryURL, presetArg, false, "")
		if err != nil {
			return err
		}
	}

	// Fetch the registry:base item; its config block seeds components.json.
	baseItem, err := registry.GetItem(registryURL, "", initURL)
	if err != nil {
		return err
	}
	if baseItem.Config == nil || baseItem.Config.Style == "" {
		return fmt.Errorf("the registry did not return a base configuration for %s", initURL)
	}

	raw := &utils.RawConfig{
		Schema: utils.SchemaURL,
		Style:  baseItem.Config.Style,
		Tailwind: utils.Tailwind{
			CSS:          resolveTailwindCSSPath(cwd, opts.CSS, existing),
			BaseColor:    baseItem.Config.Tailwind.BaseColor,
			CSSVariables: true,
		},
		RTL:         baseItem.Config.RTL,
		IconLibrary: baseItem.Config.IconLibrary,
		MenuColor:   baseItem.Config.MenuColor,
		MenuAccent:  baseItem.Config.MenuAccent,
		Aliases: utils.Aliases{
			Components: module + "/components",
			Utils:      module + "/utils",
		},
	}
	if existing != nil {
		// Keep the user's aliases on re-init.
		if existing.Aliases.Components != "" {
			raw.Aliases.Components = existing.Aliases.Components
		}
		if existing.Aliases.Utils != "" {
			raw.Aliases.Utils = existing.Aliases.Utils
		}
	}
	if opts.BaseColor != "" {
		raw.Tailwind.BaseColor = opts.BaseColor
	}

	// Make sure the Tailwind entry file exists before the CSS updater runs.
	cssPath := filepath.Join(cwd, filepath.FromSlash(raw.Tailwind.CSS))
	if _, err := os.Stat(cssPath); os.IsNotExist(err) {
		if err := os.MkdirAll(filepath.Dir(cssPath), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(cssPath, []byte("@import \"tailwindcss\";\n"), 0o644); err != nil {
			return err
		}
		logf(opts.Silent, "Created %s\n", raw.Tailwind.CSS)
	}

	logf(opts.Silent, "Writing %s.\n", utils.ConfigFileName)
	if err := utils.WriteConfig(cwd, raw); err != nil {
		return err
	}

	config, err := utils.ResolveConfigPaths(cwd, raw)
	if err != nil {
		return err
	}

	// Install the base item and its registry dependencies (utils lib item).
	if err := addComponents([]string{initURL}, config, registryURL, addComponentsOptions{
		// Init always overwrites files and CSS variables.
		Overwrite:        true,
		OverwriteCssVars: true,
		Silent:           opts.Silent,
	}); err != nil {
		return err
	}

	logf(opts.Silent, "\nProject initialization completed.\nYou may now add components.\n")
	return nil
}

// resolveTailwindCSSPath picks the Tailwind entry file: --css flag, existing
// config, detection, then the default location.
func resolveTailwindCSSPath(cwd, cssFlag string, existing *utils.RawConfig) string {
	if cssFlag != "" {
		return filepath.ToSlash(cssFlag)
	}
	if existing != nil && existing.Tailwind.CSS != "" {
		return existing.Tailwind.CSS
	}
	if found := utils.FindTailwindCSS(cwd); found != "" && !strings.Contains(found, "output") {
		return found
	}
	return "assets/css/input.css"
}
