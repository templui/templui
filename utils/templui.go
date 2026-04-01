package utils

import (
	"context"
	"crypto/rand"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"path"
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

// TwIf returns value if condition is true, otherwise an empty string.
// Example: true, "bg-red-500" → "bg-red-500"
func If(condition bool, value string) string {
	if condition {
		return value
	}
	return ""
}

// TwIfElse returns trueValue if condition is true, otherwise falseValue.
// Example: true, "bg-red-500", "bg-gray-300" → "bg-red-500"
func IfElse(condition bool, trueValue string, falseValue string) string {
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

// componentScriptBasePath is the base public path for component JavaScript files.
// In the import workflow this stays "/templui/js". The CLI rewrites it to the user's local jsPublicPath.
var componentScriptBasePath = "/templui/js"

// UseUnminifiedScripts switches component script loading to the unminified files.
// Leave this false in normal use and set it to true during app startup for debugging.
var UseUnminifiedScripts = false

// ComponentScript renders a deferred script tag for a component JavaScript file.
// Example: ComponentScript("datepicker") → <script defer src="/templui/js/datepicker.min.js?..."></script>
func ComponentScript(component string) templ.Component {
	return templ.ComponentFunc(func(ctx context.Context, w io.Writer) error {
		nonce := templ.GetNonce(ctx)
		fileName := component + ".min.js"
		if UseUnminifiedScripts {
			fileName = component + ".js"
		}
		src := ScriptURL(componentScriptBasePath + "/" + fileName)

		if _, err := io.WriteString(w, `<script type="module"`); err != nil {
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

// SetupScriptRoutes serves embedded component JavaScript files for the import workflow.
// Example: SetupScriptRoutes(mux, true) mounts /templui/js/*.js with no-store caching in development.
func SetupScriptRoutes(mux *http.ServeMux, isDevelopment bool) {
	if mux == nil || componentScriptBasePath != "/templui/js" {
		return
	}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		urlPath := strings.TrimPrefix(r.URL.Path, "/templui/js/")
		if urlPath == r.URL.Path || urlPath == "" || strings.Contains(urlPath, "..") {
			http.NotFound(w, r)
			return
		}

		w.Header().Set("Content-Type", "application/javascript")
		if isDevelopment {
			w.Header().Set("Cache-Control", "no-store")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=31536000")
		}

		fileName := path.Base(urlPath)
		component := strings.TrimSuffix(fileName, ".min.js")
		component = strings.TrimSuffix(component, ".js")
		file, err := fs.ReadFile(components.TemplFiles, path.Join(component, fileName))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		_, _ = w.Write(file)
	})

	mux.Handle("GET /templui/js/", handler)
}
