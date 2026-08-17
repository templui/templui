package updaters

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/axadrn/shadcn-templ/v2/cmd/shadcn-templ/registry"
	"github.com/axadrn/shadcn-templ/v2/cmd/shadcn-templ/utils"
)

func TestTransformComponentsRootFilesUsesConfiguredAlias(t *testing.T) {
	cwd := t.TempDir()
	componentsDir := filepath.Join(cwd, "internal", "design")
	config := &utils.Config{
		RawConfig: utils.RawConfig{
			Aliases: utils.Aliases{
				Components: "example.com/acme/app/internal/design",
				Utils:      "example.com/acme/app/internal/shared",
			},
		},
		ResolvedPaths: utils.ResolvedPaths{
			Cwd:        cwd,
			Components: componentsDir,
		},
	}

	scripts := registry.ItemFile{
		Path: "components/scripts.go",
		Type: "registry:lib",
		Content: `package components

const developmentComponentsDir = "components"
`,
	}
	got := transformContent(scripts, config)
	for _, want := range []string{
		"package design",
		`const developmentComponentsDir = "internal/design"`,
	} {
		if !strings.Contains(got, want) {
			t.Errorf("transformed scripts.go missing %q:\n%s", want, got)
		}
	}

	templFile := registry.ItemFile{
		Path:    "components/scripts.templ",
		Type:    "registry:lib",
		Content: "package components\n\ntempl Scripts() {}\n",
	}
	if got := transformContent(templFile, config); !strings.HasPrefix(got, "package design\n") {
		t.Errorf("transformed scripts.templ = %q", got)
	}

	nested := registry.ItemFile{
		Path:    "components/dialog/dialog.templ",
		Type:    "registry:ui",
		Content: "package dialog\n",
	}
	if got := transformContent(nested, config); got != nested.Content {
		t.Errorf("nested component package changed: %q", got)
	}

	target, err := resolveFilePath(scripts, config, "")
	if err != nil {
		t.Fatal(err)
	}
	if want := filepath.Join(componentsDir, "scripts.go"); target != want {
		t.Errorf("scripts target = %q, want %q", target, want)
	}
}
