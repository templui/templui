// Package templates is the pendant of src/templates in the shadcn CLI
// (create-template.ts + index.ts): a templates map, each entry a manifest
// over a vendored template directory that init copies into a new project.
//
// Files whose real name would trigger this repo's toolchain (go.mod, .go,
// .templ) are stored with a .tmpl suffix; the suffix is stripped on copy and
// the module placeholder is replaced by the project name.
package templates

import (
	"embed"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
)

//go:embed all:templ-app
var templateFiles embed.FS

// Template is the manifest shape of create-template.ts.
type Template struct {
	Name               string
	Title              string
	DefaultProjectName string
	TemplateDir        string
}

// Templates is the templates map of src/templates/index.ts. shadcn-templ ships
// one stack, so one entry; more templates are more map entries.
var Templates = map[string]Template{
	"templ": {
		Name:               "templ",
		Title:              "templ",
		DefaultProjectName: "templ-app",
		TemplateDir:        "templ-app",
	},
}

// Names lists the valid template names for error messages and usage.
func Names() []string {
	names := make([]string, 0, len(Templates))
	for name := range Templates {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

// modulePlaceholder is the module path the template sources use; Create
// replaces it with the project name.
const modulePlaceholder = "templ-app"

// Create copies the template into projectPath. The directory must not exist
// yet (or be empty), like shadcn's scaffold preflight.
func Create(t Template, projectPath, projectName string) error {
	if entries, err := os.ReadDir(projectPath); err == nil && len(entries) > 0 {
		return fmt.Errorf("directory %s already exists and is not empty", projectPath)
	}

	return fs.WalkDir(templateFiles, t.TemplateDir, func(src string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel := strings.TrimPrefix(src, t.TemplateDir)
		rel = strings.TrimPrefix(rel, "/")
		target := filepath.Join(projectPath, filepath.FromSlash(rel))

		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}

		data, err := templateFiles.ReadFile(src)
		if err != nil {
			return err
		}
		if name, ok := strings.CutSuffix(path.Base(rel), ".tmpl"); ok {
			target = filepath.Join(filepath.Dir(target), name)
		}
		content := strings.ReplaceAll(string(data), modulePlaceholder, projectName)
		return os.WriteFile(target, []byte(content), 0o644)
	})
}
