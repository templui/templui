// HTTP handlers, the pendants of shadcn's app/(app)/(create)/init/route.ts
// and the static r/styles/<style>/<name>.json registry output.
package registryapi

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"slices"
	"strings"

	"github.com/axadrn/shadcn-templ/v2/internal/inliner"
)

// writeJSON serializes like NextResponse.json: no HTML escaping, no
// trailing-newline indentation games.
func writeJSON(w http.ResponseWriter, status int, v any) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(bytes.TrimRight(buf.Bytes(), "\n"))
}

type errorBody struct {
	Error string `json:"error"`
}

// InitHandler serves GET /init: parse ?preset (or individual params) into a
// design system config and return the registry:base item, or the partial one
// for ?only=theme|font. Invalid input is a 400 with {"error": ...} like the
// live route.
func InitHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()

		config, err := ParseDesignSystemConfig(q)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, errorBody{Error: err.Error()})
			return
		}

		parts, err := ParseRegistryBaseParts(getParam(q, "only"))
		if err != nil {
			writeJSON(w, http.StatusBadRequest, errorBody{Error: err.Error()})
			return
		}

		var item Item
		if parts != nil {
			item, err = BuildPartialRegistryBase(config, parts)
		} else {
			item, err = BuildRegistryBase(config)
		}
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, errorBody{Error: err.Error()})
			return
		}

		writeJSON(w, http.StatusOK, item)
	})
}

// StylesHandler serves GET /r/styles/{style}/{file} where file is
// index.json or <component>.json. Unknown style or component is a 404 like
// the live registry.
func StylesHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		styleName := r.PathValue("style")
		file := r.PathValue("file")

		name, ok := strings.CutSuffix(file, ".json")
		if !ok || name == "" {
			http.NotFound(w, r)
			return
		}

		if name == "index" {
			item := BuildStyleIndex(styleName)
			if item == nil {
				http.NotFound(w, r)
				return
			}
			writeJSON(w, http.StatusOK, item)
			return
		}

		// The install-config half of shadcn's CLI transformers: the CLI
		// sends its project menuColor, rtl and font-heading support; the markers resolve here
		// (shadcn-templ has no separate install step).
		opts := inliner.Options{
			RTL:         r.URL.Query().Get("rtl") == "true",
			FontHeading: r.URL.Query().Get("fontHeading") == "true",
		}
		if menuColor := r.URL.Query().Get("menuColor"); slices.Contains(MenuColors, menuColor) {
			opts.MenuColor = menuColor
		}
		item, err := BuildStyleItem(styleName, name, opts)
		if err != nil {
			log.Printf("registryapi: build %s/%s: %v", styleName, name, err)
			writeJSON(w, http.StatusInternalServerError, errorBody{Error: err.Error()})
			return
		}
		if item == nil {
			http.NotFound(w, r)
			return
		}
		writeJSON(w, http.StatusOK, item)
	})
}
