package utils

import (
	"context"
	"crypto/rand"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/a-h/templ"
	"github.com/templui/templui/components"

	twmerge "github.com/Oudwins/tailwind-merge-go"
)

// TwMerge combines Tailwind classes and resolves conflicts.
// Example: "bg-red-500 hover:bg-blue-500", "bg-green-500" → "hover:bg-blue-500 bg-green-500"
func TwMerge(classes ...string) string {
	return twmerge.Merge(classes...)
}

// TwIf returns value if condition is true, otherwise an empty value of type T.
// Example: true, "bg-red-500" → "bg-red-500"
func If[T comparable](condition bool, value T) T {
	var empty T
	if condition {
		return value
	}
	return empty
}

// TwIfElse returns trueValue if condition is true, otherwise falseValue.
// Example: true, "bg-red-500", "bg-gray-300" → "bg-red-500"
func IfElse[T any](condition bool, trueValue T, falseValue T) T {
	if condition {
		return trueValue
	}
	return falseValue
}

// MergeAttributes combines multiple Attributes into one.
// Example: MergeAttributes(attr1, attr2) → combined attributes
func MergeAttributes(attrs ...templ.Attributes) templ.Attributes {
	merged := templ.Attributes{}
	for _, attr := range attrs {
		for k, v := range attr {
			merged[k] = v
		}
	}
	return merged
}

// RandomID generates a random ID string.
// Example: RandomID() → "id-1a2b3c"
func RandomID() string {
	return fmt.Sprintf("id-%s", rand.Text())
}

// ScriptVersion is a timestamp generated at app start for cache busting.
// Used in component script tags to append ?v=<timestamp> to script URLs.
var ScriptVersion = fmt.Sprintf("%d", time.Now().Unix())

// ScriptURL generates cache-busted script URLs.
// Override this to use custom cache busting (CDN, content hashing, etc.)
//
// Example override in your app:
//
//	func init() {
//	    utils.ScriptURL = func(path string) string {
//	        return myAssetManifest.GetURL(path)
//	    }
//	}
var ScriptURL = func(path string) string {
	return path + "?v=" + ScriptVersion
}

var componentScriptBasePath = "/templui/js"

func ComponentScript(component string) templ.Component {
	return templ.ComponentFunc(func(ctx context.Context, w io.Writer) error {
		nonce := templ.GetNonce(ctx)
		src := ScriptURL(componentScriptBasePath + "/" + component + ".min.js")

		if _, err := io.WriteString(w, `<script defer`); err != nil {
			return err
		}
		if nonce != "" {
			if _, err := io.WriteString(w, ` nonce="`); err != nil {
				return err
			}
			if _, err := io.WriteString(w, templ.EscapeString(nonce)); err != nil {
				return err
			}
			if _, err := io.WriteString(w, `"`); err != nil {
				return err
			}
		}
		if _, err := io.WriteString(w, ` src="`); err != nil {
			return err
		}
		if _, err := io.WriteString(w, templ.EscapeString(src)); err != nil {
			return err
		}
		if _, err := io.WriteString(w, `"></script>`); err != nil {
			return err
		}

		return nil
	})
}

func SetupScriptRoutes(mux *http.ServeMux, isDevelopment bool) {
	if mux == nil || componentScriptBasePath != "/templui/js" {
		return
	}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/templui/js/")
		if path == r.URL.Path || path == "" || strings.Contains(path, "..") {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", "application/javascript")
		if isDevelopment {
			w.Header().Set("Cache-Control", "no-store")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=31536000")
		}

		componentPath := strings.TrimSuffix(path, ".min.js")
		component := strings.Trim(strings.Split(componentPath, "/")[0], "/")
		file, err := fs.ReadFile(components.TemplFiles, filepath.Join(component, component+".min.js"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		_, _ = w.Write(file)
	})

	mux.Handle("GET /templui/js/", handler)
}
