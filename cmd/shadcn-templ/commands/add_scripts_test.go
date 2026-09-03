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

func TestAddResolvesFontHeadingFromProjectStylesheet(t *testing.T) {
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

	tests := []struct {
		name string
		css  string
		want bool
	}{
		{name: "heading variable", css: "@import \"tailwindcss\";\n:root { --font-heading: var(--font-sans); }\n", want: true},
		{name: "no heading variable", css: "@import \"tailwindcss\";\n", want: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cwd := t.TempDir()
			goModPath := filepath.Join(cwd, "go.mod")
			err := os.WriteFile(goModPath, []byte("module example.com/acme/app\n\ngo 1.25.0\n"), 0o644)
			if err != nil {
				t.Fatal(err)
			}
			err = RunInit(InitOptions{Cwd: cwd, Force: true, Silent: true, Registry: server.URL})
			if err != nil {
				t.Fatal(err)
			}
			cssPath := filepath.Join(cwd, "assets/css/globals.css")
			err = os.WriteFile(cssPath, []byte(tt.css), 0o644)
			if err != nil {
				t.Fatal(err)
			}
			err = RunAdd([]string{"card"}, AddOptions{Cwd: cwd, Overwrite: true, Silent: true, Registry: server.URL})
			if err != nil {
				t.Fatal(err)
			}
			content, err := os.ReadFile(filepath.Join(cwd, "components/card/card.templ"))
			if err != nil {
				t.Fatal(err)
			}
			has := strings.Contains(string(content), "font-heading")
			if has != tt.want {
				t.Errorf("font-heading presence = %t, want %t", has, tt.want)
			}
		})
	}
}

func TestSupportsFontHeading(t *testing.T) {
	tests := []struct {
		name string
		css  string
		want bool
	}{
		{name: "root declaration", css: ":root { --font-heading: var(--font-sans); }", want: true},
		{name: "theme declaration", css: "@theme inline { --font-heading: var(--font-serif); }", want: true},
		{name: "space before colon does not match upstream", css: "--font-heading : var(--font-sans);", want: false},
		{name: "missing", css: "--font-sans: Inter;", want: false},
		{name: "empty", css: "", want: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "globals.css")
			err := os.WriteFile(path, []byte(tt.css), 0o644)
			if err != nil {
				t.Fatal(err)
			}
			got := supportsFontHeading(path)
			if got != tt.want {
				t.Errorf("supportsFontHeading() = %t, want %t", got, tt.want)
			}
		})
	}
	if supportsFontHeading(filepath.Join(t.TempDir(), "missing.css")) {
		t.Error("supportsFontHeading() = true for missing file")
	}
}
