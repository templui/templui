package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/a-h/templ"

	"github.com/templui/templui/assets"
	"github.com/templui/templui/components"
	"github.com/templui/templui/internal/config"
	"github.com/templui/templui/internal/middleware"
	"github.com/templui/templui/internal/registry"
	"github.com/templui/templui/internal/registryapi"
	"github.com/templui/templui/internal/service"
	"github.com/templui/templui/internal/shared"
	"github.com/templui/templui/internal/ui/charts"
	"github.com/templui/templui/internal/ui/examples"
	"github.com/templui/templui/internal/ui/pages"
	"github.com/templui/templui/static"
)

// htmxHandler wraps a templ component to support HTMX fragment requests
func htmxHandler(component templ.Component) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if middleware.IsHtmxRequest(r) {
			// For HTMX requests, render content, toc, and title fragments
			// The toc and title fragments have hx-swap-oob attribute for out-of-band swap
			templ.Handler(component, templ.WithFragments("content", "toc", "title")).ServeHTTP(w, r)
		} else {
			// For regular requests, render the full page
			templ.Handler(component).ServeHTTP(w, r)
		}
	})
}

func main() {
	mux := http.NewServeMux()
	config.LoadConfig()

	SetupAssetsRoutes(mux)

	// Initialize markdown docs service
	docsService := service.NewDocsService()

	wrappedMux := middleware.WithURLPathValue(
		middleware.CacheControlMiddleware(
			middleware.GitHubStarsMiddleware(
				mux,
			),
		),
	)

	mux.HandleFunc("GET /sitemap.xml", func(w http.ResponseWriter, r *http.Request) {
		content, err := static.Files.ReadFile("sitemap.xml")
		if err != nil {
			http.Error(w, "Sitemap not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/xml")
		w.Write(content)
	})

	mux.HandleFunc("GET /robots.txt", func(w http.ResponseWriter, r *http.Request) {
		content, err := static.Files.ReadFile("robots.txt")
		if err != nil {
			http.Error(w, "Robots.txt not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "text/plain")
		w.Write(content)
	})

	mux.HandleFunc("GET /llms.txt", func(w http.ResponseWriter, r *http.Request) {
		content, err := static.Files.ReadFile("llms.txt")
		if err != nil {
			http.Error(w, "llms.txt not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Write(content)
	})

	mux.Handle("GET /{$}", templ.Handler(pages.Landing()))
	mux.Handle("GET /docs", http.RedirectHandler("/docs/introduction", http.StatusSeeOther))
	mux.Handle("GET /docs/getting-started", http.RedirectHandler("/docs/introduction", http.StatusSeeOther))
	mux.Handle("GET /docs/components", htmxHandler(pages.ComponentsOverview()))
	mux.Handle("GET /create", htmxHandler(pages.Create()))
	mux.Handle("GET /create/preview", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		item := r.URL.Query().Get("item")
		if err := pages.CreatePreview(item).Render(r.Context(), w); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}))
	mux.Handle("GET /typeset", htmxHandler(pages.Typeset()))
	mux.Handle("GET /typeset/preview", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		item := r.URL.Query().Get("item")
		if item == "" {
			item = "docs"
		}
		if !pages.TypesetFixtureExists(item) {
			http.NotFound(w, r)
			return
		}
		params := pages.LoadTypesetPreviewParams(r.URL.Query())
		if err := pages.TypesetPreview(item, params).Render(r.Context(), w); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}))
	// Raw stylesheet for the typeset Get Code button, the pendant of shadcn's
	// app/typeset.css/route.ts: read fresh on every request so the copy is
	// never a stale snapshot.
	mux.HandleFunc("GET /typeset.css", func(w http.ResponseWriter, r *http.Request) {
		var css []byte
		var err error
		if config.AppConfig.GoEnv != "production" {
			css, err = os.ReadFile("./assets/css/typeset.css")
		} else {
			css, err = assets.Assets.ReadFile("css/typeset.css")
		}
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/css; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.Write(css)
	})

	// Registry server, the pendant of shadcn's /init route and static
	// r/styles registry: /init returns the registry:base item for a design
	// system config (?preset=<code> or individual params, ?only=theme|font
	// for the partial item); /r/styles/{style}/{name}.json returns a
	// component compiled for that style through the inliner.
	mux.Handle("GET /init", registryapi.InitHandler())
	mux.Handle("GET /r/styles/{style}/{file}", registryapi.StylesHandler())

	// The source registry file (shadcn's app-root registry.json shape),
	// served verbatim.
	mux.HandleFunc("GET /r/registry.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(registry.JSON())
	})

	// Markdown-based documentation pages
	markdownDocsHandler := func(slug string) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			doc, err := docsService.GetPage(slug)
			if err != nil {
				http.Error(w, "Documentation page not found: "+err.Error(), http.StatusNotFound)
				return
			}

			prev, next := docsPagerLinks("/docs/" + slug)
			htmxHandler(pages.MarkdownDoc(doc, prev, next)).ServeHTTP(w, r)
		})
	}

	// Raw markdown of a root docs page under <slug>.md, like the component
	// pages, for the copy-page menu.
	markdownSourceHandler := func(slug string) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			source, err := docsService.GetPageSource(slug)
			if err != nil {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
			w.Write(source)
		})
	}

	for _, slug := range []string{
		"introduction", "installation", "components-json", "package-imports", "theming", "typeset", "dark-mode", "cli", "changelog",
		"utils/scroll-fade", "utils/shimmer",
		"registry", "registry/getting-started", "registry/registry-json", "registry/registry-item-json",
	} {
		mux.Handle("GET /docs/"+slug, markdownDocsHandler(slug))
		mux.Handle("GET /docs/"+slug+".md", markdownSourceHandler(slug))
	}
	// The old How To Use page moved into the installation chapter.
	mux.Handle("GET /docs/how-to-use", http.RedirectHandler("/docs/installation", http.StatusMovedPermanently))
	// Typography redirects to /docs/typeset, like shadcn's
	// /docs/components/*/typography redirects (permanent: true).
	mux.Handle("GET /docs/components/typography", http.RedirectHandler("/docs/typeset", http.StatusMovedPermanently))
	// Components
	mux.Handle("GET /docs/components/{slug}", componentDocHandler(docsService))
	mux.Handle("GET /charts", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/charts/area", http.StatusMovedPermanently)
	}))
	mux.Handle("GET /charts/{type}", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		chartType := r.PathValue("type")
		if !pages.ChartTypes[chartType] {
			http.NotFound(w, r)
			return
		}
		if err := pages.Charts(chartType).Render(r.Context(), w); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}))
	mux.Handle("GET /view/{name}", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := r.PathValue("name")
		if charts.Component(name) == nil {
			http.NotFound(w, r)
			return
		}
		if err := pages.ChartView(name).Render(r.Context(), w); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}))
	mux.Handle("GET /preview/{name}", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		entry, ok := examples.Registry[r.PathValue("name")]
		if !ok {
			http.NotFound(w, r)
			return
		}
		if err := pages.ExamplePreview(r.PathValue("name"), entry).Render(r.Context(), w); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}))

	// Showcase API

	// Test Form Items Handler
	mux.Handle("GET /docs/test-form-items", htmxHandler(pages.TestFormItems()))
	mux.HandleFunc("POST /docs/test-form-items", func(w http.ResponseWriter, r *http.Request) {
		r.ParseForm()
		fmt.Println("=== Form Values Received ===")
		fmt.Printf("switch_default: %q\n", r.FormValue("switch_default"))
		fmt.Printf("switch_custom: %q\n", r.FormValue("switch_custom"))
		fmt.Printf("checkbox_default: %q\n", r.FormValue("checkbox_default"))
		fmt.Printf("checkbox_custom: %q\n", r.FormValue("checkbox_custom"))
		fmt.Printf("interests (multiple checkboxes): %v\n", r.Form["interests"])
		fmt.Printf("features (multiple switches): %v\n", r.Form["features"])
		fmt.Println("============================")

		// Redirect back to form
		http.Redirect(w, r, "/docs/test-form-items", http.StatusSeeOther)
	})

	// 404 handler - using Go 1.22+ wildcard syntax
	// The {$} ensures this only matches exactly "/" and not as a prefix
	// All unmatched routes will fall through to this catch-all
	mux.HandleFunc("/{path...}", notFoundHandler)

	log.Println("Server is running on http://localhost:8090")
	http.ListenAndServe(":8090", wrappedMux)
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	pages.NotFound().Render(r.Context(), w)
}

func SetupAssetsRoutes(mux *http.ServeMux) {
	var isDevelopment = config.AppConfig.GoEnv != "production"

	assetHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isDevelopment {
			w.Header().Set("Cache-Control", "no-store")
		}

		var fs http.Handler
		if isDevelopment {
			fs = http.FileServer(http.Dir("./assets"))
		} else {
			fs = http.FileServer(http.FS(assets.Assets))
		}

		fs.ServeHTTP(w, r)
	})

	mux.Handle("GET /assets/", http.StripPrefix("/assets/", assetHandler))

	// Component JS bundle
	mux.Handle("GET /components/{bundle}", components.ScriptsHandler())

	// Safari Favicon Compatibility
	// Safari often ignores HTML favicon tags and looks for files in the root directory.
	// We serve specific favicon files from /assets/img/favicon/ at root URLs for better Safari compatibility.
	faviconRoutes := map[string]string{
		"/favicon.ico":          "img/favicon/favicon.ico",
		"/apple-touch-icon.png": "img/favicon/apple-touch-icon.png",
		"/favicon-32x32.png":    "img/favicon/favicon-32x32.png",
		"/favicon-16x16.png":    "img/favicon/favicon-16x16.png",
	}

	for route, assetPath := range faviconRoutes {
		// Capture variables for closure
		r := route
		path := assetPath

		mux.HandleFunc("GET "+r, func(w http.ResponseWriter, r *http.Request) {
			// Set content type based on file extension
			if strings.HasSuffix(path, ".ico") {
				w.Header().Set("Content-Type", "image/x-icon")
			} else if strings.HasSuffix(path, ".png") {
				w.Header().Set("Content-Type", "image/png")
			}

			if isDevelopment {
				w.Header().Set("Cache-Control", "no-store")
				http.ServeFile(w, r, "./assets/"+path)
			} else {
				content, err := assets.Assets.ReadFile(path)
				if err != nil {
					http.Error(w, "Favicon not found", http.StatusNotFound)
					return
				}
				w.Write(content)
			}
		})
	}
}

// componentDocHandler serves markdown-authored component pages (and their
// raw markdown under <slug>.md for the copy-page menu).
func componentDocHandler(docsService *service.DocsService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slug := r.PathValue("slug")

		if strings.HasSuffix(slug, ".md") {
			source, err := docsService.GetComponentPageSource(strings.TrimSuffix(slug, ".md"))
			if err != nil {
				http.NotFound(w, r)
				return
			}
			w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
			w.Write(source)
			return
		}

		page, err := docsService.GetComponentPage(slug)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		prev, next := docsPagerLinks("/docs/components/" + slug)
		htmxHandler(pages.ComponentDoc(page, prev, next)).ServeHTTP(w, r)
	})
}

// docsPagerLinks finds the previous/next docs page from the sidebar sections,
// flattened across section boundaries like shadcn's findNeighbour over the
// docs page tree. Links outside /docs/ (llms.txt) are not pages and stay out.
func docsPagerLinks(href string) (pages.PagerLink, pages.PagerLink) {
	var flat []shared.SideLink
	for _, section := range shared.Sections {
		for _, link := range section.Links {
			if strings.HasPrefix(link.Href, "/docs/") {
				flat = append(flat, link)
			}
		}
	}
	var prev, next pages.PagerLink
	for i, link := range flat {
		if link.Href != href {
			continue
		}
		if i > 0 {
			prev = pages.PagerLink{Title: flat[i-1].Text, Href: flat[i-1].Href}
		}
		if i < len(flat)-1 {
			next = pages.PagerLink{Title: flat[i+1].Text, Href: flat[i+1].Href}
		}
	}
	return prev, next
}
