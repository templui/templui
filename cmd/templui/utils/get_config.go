// Package utils is the pendant of shadcn/src/utils: get_config.go covers
// get-config.ts, the components.json shape and its resolved paths.
//
// components.json field mapping against shadcn's schema (every dropped npm
// field documented):
//
//	$schema:               https://templui.io/schema/components.json
//	style:                 kept 1:1 ("base-<style>", e.g. "base-nova")
//	tailwind.css:          kept 1:1 (the user's Tailwind entry file)
//	tailwind.baseColor:    kept 1:1
//	tailwind.cssVariables: kept 1:1 (always true; templui has no inline-theme
//	                       mode)
//	tailwind.config:       dropped; Tailwind v4 has no config file and templui
//	                       is v4-only (shadcn keeps "" for v3 compat)
//	tailwind.prefix:       dropped; templui components ship unprefixed classes
//	rsc, tsx:              dropped; React Server Components and TypeScript
//	                       have no Go pendant
//	iconLibrary:           kept 1:1
//	rtl, menuColor,
//	menuAccent:            kept 1:1 (written from the registry:base config)
//	aliases.components:    Go pendant: the import path of the components dir
//	                       ("<module>/components"); shadcn stores a tsconfig
//	                       alias ("@/components")
//	aliases.utils:         Go pendant: "<module>/utils"
//	aliases.ui/lib/hooks:  dropped; templui has no separate ui/lib/hooks dirs
//	registries:            dropped; there are no third-party templui
//	                       registries (the --registry flag and
//	                       TEMPLUI_REGISTRY env cover local dev)
package utils

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

// SchemaURL is the $schema value of components.json.
const SchemaURL = "https://templui.io/schema/components.json"

// Tailwind is the tailwind block of components.json.
type Tailwind struct {
	CSS          string `json:"css"`
	BaseColor    string `json:"baseColor"`
	CSSVariables bool   `json:"cssVariables"`
}

// Aliases holds Go import paths, the pendant of shadcn's tsconfig aliases.
type Aliases struct {
	Components string `json:"components"`
	Utils      string `json:"utils"`
}

// RawConfig is the rawConfigSchema pendant: components.json as written.
type RawConfig struct {
	Schema      string   `json:"$schema,omitempty"`
	Style       string   `json:"style"`
	Tailwind    Tailwind `json:"tailwind"`
	RTL         *bool    `json:"rtl,omitempty"`
	IconLibrary string   `json:"iconLibrary,omitempty"`
	MenuColor   string   `json:"menuColor,omitempty"`
	MenuAccent  string   `json:"menuAccent,omitempty"`
	Aliases     Aliases  `json:"aliases"`
}

// ResolvedPaths is the resolvedPaths pendant: absolute paths derived from the
// aliases and the go.mod module path.
type ResolvedPaths struct {
	Cwd         string
	TailwindCSS string
	Components  string
	Utils       string
}

// Config is the configSchema pendant: RawConfig plus resolved paths.
type Config struct {
	RawConfig
	Module        string
	ResolvedPaths ResolvedPaths
}

// ConfigFileName is the components.json file name.
const ConfigFileName = "components.json"

// GetConfig loads and resolves components.json from cwd. Returns (nil, nil)
// when no components.json exists (the shadcn null config).
func GetConfig(cwd string) (*Config, error) {
	raw, err := GetRawConfig(cwd)
	if err != nil || raw == nil {
		return nil, err
	}
	return ResolveConfigPaths(cwd, raw)
}

// GetRawConfig reads components.json without resolving paths.
func GetRawConfig(cwd string) (*RawConfig, error) {
	data, err := os.ReadFile(filepath.Join(cwd, ConfigFileName))
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var raw RawConfig
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("invalid configuration found in %s: %w", filepath.Join(cwd, ConfigFileName), err)
	}
	return &raw, nil
}

// ResolveConfigPaths is the resolveConfigPaths pendant: derive absolute
// directories from the Go import path aliases via the go.mod module path.
func ResolveConfigPaths(cwd string, raw *RawConfig) (*Config, error) {
	module, err := ModulePath(cwd)
	if err != nil {
		return nil, err
	}

	componentsDir, err := aliasDir(cwd, module, raw.Aliases.Components, "components")
	if err != nil {
		return nil, err
	}
	utilsDir, err := aliasDir(cwd, module, raw.Aliases.Utils, "utils")
	if err != nil {
		return nil, err
	}

	if raw.Tailwind.CSS == "" {
		return nil, fmt.Errorf("no tailwind.css path in %s", ConfigFileName)
	}

	return &Config{
		RawConfig: *raw,
		Module:    module,
		ResolvedPaths: ResolvedPaths{
			Cwd:         cwd,
			TailwindCSS: filepath.Join(cwd, filepath.FromSlash(raw.Tailwind.CSS)),
			Components:  componentsDir,
			Utils:       utilsDir,
		},
	}, nil
}

// aliasDir maps an import path alias under the module to a directory.
func aliasDir(cwd, module, alias, key string) (string, error) {
	if alias == "" {
		return "", fmt.Errorf("missing aliases.%s in %s", key, ConfigFileName)
	}
	if alias == module {
		return cwd, nil
	}
	rel, ok := strings.CutPrefix(alias, module+"/")
	if !ok {
		return "", fmt.Errorf("aliases.%s %q is not under the module path %q; configure an import path inside your module", key, alias, module)
	}
	return filepath.Join(cwd, filepath.FromSlash(rel)), nil
}

// ModulePath reads the module path from go.mod, the pendant of shadcn
// resolving tsconfig path aliases.
func ModulePath(cwd string) (string, error) {
	data, err := os.ReadFile(filepath.Join(cwd, "go.mod"))
	if err != nil {
		if os.IsNotExist(err) {
			return "", fmt.Errorf("no go.mod found at %s. A Go module is required. Run 'go mod init' first", cwd)
		}
		return "", err
	}
	for line := range strings.Lines(string(data)) {
		line = strings.TrimSpace(line)
		if module, ok := strings.CutPrefix(line, "module "); ok {
			return strings.TrimSpace(module), nil
		}
	}
	return "", fmt.Errorf("no module directive in %s", filepath.Join(cwd, "go.mod"))
}

// WriteConfig writes components.json (2-space indent plus trailing newline,
// like the reference).
func WriteConfig(cwd string, raw *RawConfig) error {
	data, err := json.MarshalIndent(raw, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(cwd, ConfigFileName), append(data, '\n'), 0o644)
}

// FindTailwindCSS is the pendant of getTailwindCssFile in get-project-info.ts:
// find the CSS file that imports tailwindcss. Returns a cwd-relative slash
// path or "".
func FindTailwindCSS(cwd string) string {
	var found string
	_ = filepath.WalkDir(cwd, func(path string, d fs.DirEntry, err error) error {
		if err != nil || found != "" {
			return fs.SkipAll
		}
		if d.IsDir() {
			name := d.Name()
			if path != cwd && (strings.HasPrefix(name, ".") || name == "node_modules" || name == "vendor" || name == "dist") {
				return fs.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(d.Name(), ".css") {
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		content := string(data)
		if strings.Contains(content, `@import "tailwindcss"`) || strings.Contains(content, "@import 'tailwindcss'") || strings.Contains(content, "@tailwind base") {
			rel, err := filepath.Rel(cwd, path)
			if err == nil {
				found = filepath.ToSlash(rel)
				return fs.SkipAll
			}
		}
		return nil
	})
	return found
}
