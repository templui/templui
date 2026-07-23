package utils

import (
	"context"
	"crypto/rand"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/a-h/templ"
	"github.com/templui/templui/components"

	twmerge "github.com/Oudwins/tailwind-merge-go"
)

// TwMerge combines Tailwind classes and resolves conflicts.
// Example: "bg-red-500 hover:bg-blue-500", "bg-green-500" → "hover:bg-blue-500 bg-green-500"
// tailwind-merge-go does not understand two pieces of Tailwind v4 syntax yet,
// so conflicts against such classes were never resolved:
//   - the variable shorthand px-(--card-spacing), translated to the v3
//     arbitrary form px-[var(--card-spacing)] for the merge and back after
//   - the trailing important marker p-2!, translated to the v3 prefix form
//     !p-2 for the merge and back after
// The repo uses the v4 forms exclusively, so the back translations cannot
// collide. DELETE this shim (the regexes, twImportant* and their calls) once
// github.com/Oudwins/tailwind-merge-go parses the v4 syntax natively.
var (
	twV4Var = regexp.MustCompile(`-\((--[A-Za-z0-9-]+)\)`)
	twV3Var = regexp.MustCompile(`-\[var\((--[A-Za-z0-9-]+)\)\]`)
)

// lastTopLevelColon returns the index of the last variant separator outside
// of square brackets, or -1 (arbitrary values may contain colons, e.g.
// has-[:checked]:bg-primary).
func lastTopLevelColon(s string) int {
	depth, last := 0, -1
	for i, r := range s {
		switch r {
		case '[':
			depth++
		case ']':
			depth--
		case ':':
			if depth == 0 {
				last = i
			}
		}
	}
	return last
}

// twImportantToV3 rewrites a trailing v4 important marker onto the base
// utility: group-data-[x]:p-2! → group-data-[x]:!p-2.
func twImportantToV3(token string) string {
	if !strings.HasSuffix(token, "!") {
		return token
	}
	base := strings.TrimSuffix(token, "!")
	i := lastTopLevelColon(base)
	return base[:i+1] + "!" + base[i+1:]
}

// twImportantToV4 moves the prefix marker back to the v4 trailing position.
func twImportantToV4(token string) string {
	i := lastTopLevelColon(token)
	if i+1 >= len(token) || token[i+1] != '!' {
		return token
	}
	return token[:i+1] + token[i+2:] + "!"
}

func twMapTokens(s string, f func(string) string) string {
	if !strings.Contains(s, "!") {
		return s
	}
	tokens := strings.Fields(s)
	for i, t := range tokens {
		tokens[i] = f(t)
	}
	return strings.Join(tokens, " ")
}

func TwMerge(classes ...string) string {
	merged := make([]string, len(classes))
	for i, c := range classes {
		merged[i] = twMapTokens(twV4Var.ReplaceAllString(c, "-[var($1)]"), twImportantToV3)
	}
	out := twMapTokens(twmerge.Merge(merged...), twImportantToV4)
	return twV3Var.ReplaceAllString(out, "-($1)")
}

// If returns value if condition is true, otherwise the zero value of T.
// Example: true, "bg-red-500" → "bg-red-500"
func If[T any](condition bool, value T) T {
	var empty T
	if condition {
		return value
	}
	return empty
}

// Ptr returns a pointer to v. Useful for optional props whose zero value is
// meaningful (e.g. togglegroup.Props{Spacing: utils.Ptr(0)}).
func Ptr[T any](v T) *T {
	return &v
}

// IfElse returns trueValue if condition is true, otherwise falseValue.
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
