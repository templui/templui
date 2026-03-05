package utils

import (
	"fmt"
	"os"
	"strings"
	"time"

	"crypto/rand"

	"github.com/a-h/templ"
	twmerge "github.com/Oudwins/tailwind-merge-go"
)

// TwMerge combines Tailwind classes and resolves conflicts.
// Example: "bg-red-500 hover:bg-blue-500", "bg-green-500" → "hover:bg-blue-500 bg-green-500"
func TwMerge(classes ...string) string {
	return twmerge.Merge(classes...)
}

// If returns value if condition is true, otherwise an empty value of type T.
// Example: true, "bg-red-500" → "bg-red-500"
func If[T comparable](condition bool, value T) T {
	var empty T
	if condition {
		return value
	}
	return empty
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
// Used in Script() templates to append ?v=<timestamp> to script URLs.
var ScriptVersion = fmt.Sprintf("%d", time.Now().Unix())

var (
	RemoteScriptCDNBase = "https://cdn.jsdelivr.net/gh/templui/templui"
)

func remoteScriptRef() string {
	if ref := strings.TrimSpace(os.Getenv("TEMPLUI_SCRIPT_REF")); ref != "" {
		return ref
	}
	return "main"
}

func RemoteComponentScriptURL(component string) string {
	ref := remoteScriptRef()
	return fmt.Sprintf("%s@%s/internal/components/%s/%s.min.js", RemoteScriptCDNBase, ref, component, component)
}
