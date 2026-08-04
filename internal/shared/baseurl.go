package shared

import "os"

// BaseURL is the absolute origin of the running site, the single source for
// every self-referencing absolute URL (canonical, og:url, AI prompt links,
// registry meta). BASE_URL overrides it per deployment - the beta sets
// https://v2.templui.io, stable falls back to the default.
func BaseURL() string {
	if v := os.Getenv("BASE_URL"); v != "" {
		return v
	}
	return "https://templui.io"
}
