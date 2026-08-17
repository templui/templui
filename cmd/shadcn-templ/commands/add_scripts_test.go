package commands

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/axadrn/shadcn-templ/v2/cmd/shadcn-templ/utils"
	internalregistry "github.com/axadrn/shadcn-templ/v2/internal/registry"
	"github.com/axadrn/shadcn-templ/v2/internal/registryapi"
)

func TestAddJavaScriptComponentInstallsRuntimeAtComponentsAlias(t *testing.T) {
	t.Setenv("GO_ENV", "production")

	mux := http.NewServeMux()
	mux.Handle("GET /init", registryapi.InitHandler())
	mux.Handle("GET /r/styles/{style}/{file}", registryapi.StylesHandler())
	mux.HandleFunc("GET /r/registry.json", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(internalregistry.JSON())
	})
	mux.HandleFunc("GET /assets/css/{file}", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("/* test stylesheet */\n"))
	})
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)

	cwd := t.TempDir()
	if err := os.WriteFile(filepath.Join(cwd, "go.mod"), []byte("module example.com/acme/app\n\ngo 1.25.0\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := utils.WriteConfig(cwd, &utils.RawConfig{
		Style: "base-nova",
		Tailwind: utils.Tailwind{
			CSS:          "assets/css/globals.css",
			BaseColor:    "neutral",
			CSSVariables: true,
		},
		Aliases: utils.Aliases{
			Components: "example.com/acme/app/internal/design",
			Utils:      "example.com/acme/app/internal/shared",
		},
	}); err != nil {
		t.Fatal(err)
	}

	if err := RunInit(InitOptions{
		Cwd:      cwd,
		Force:    true,
		Silent:   true,
		Registry: server.URL,
	}); err != nil {
		t.Fatal(err)
	}
	if err := RunAdd([]string{"dialog"}, AddOptions{
		Cwd:      cwd,
		Silent:   true,
		Registry: server.URL,
	}); err != nil {
		t.Fatal(err)
	}

	assertFileContains := func(path string, wants ...string) {
		t.Helper()
		content, err := os.ReadFile(filepath.Join(cwd, filepath.FromSlash(path)))
		if err != nil {
			t.Fatalf("read %s: %v", path, err)
		}
		for _, want := range wants {
			if !strings.Contains(string(content), want) {
				t.Errorf("%s missing %q", path, want)
			}
		}
	}

	assertFileContains(
		"internal/design/scripts.go",
		"package design",
		`const developmentComponentsDir = "internal/design"`,
	)
	assertFileContains("internal/design/scripts.templ", "package design")
	assertFileContains("internal/design/embed.go", "package design")
	assertFileContains("internal/design/dialog/dialog.js", "(() =>")
	assertFileContains("internal/shared/shadcn-templ.go", "package shared")
}
