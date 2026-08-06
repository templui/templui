package shared

import (
	"bytes"
	"os"
)

// canonicalURL is the stable origin the sources are authored against. Every
// self-referencing absolute URL in the repo is written as this origin and
// rebased onto BaseURL at serve time.
const canonicalURL = "https://shadcn-templ.com"

// BaseURL is the absolute origin of the running site, the single source for
// every self-referencing absolute URL (canonical, og:url, AI prompt links,
// registry meta). BASE_URL overrides it per deployment - the beta sets
// https://shadcn-templ.com, task dev sets http://localhost:8090, stable falls
// back to the default.
func BaseURL() string {
	if v := os.Getenv("BASE_URL"); v != "" {
		return v
	}
	return canonicalURL
}

// Rebase rewrites the canonical origin in served content onto BaseURL so
// self-links work everywhere alike: localhost, the beta, stable and any
// future deployment. On the stable origin it is a no-op. Other origins that
// merely contain the host (e.g. https://shadcn-templ.com as a documented CLI
// default) are left untouched because they never match the canonical prefix.
func Rebase(content []byte) []byte {
	if base := BaseURL(); base != canonicalURL {
		return bytes.ReplaceAll(content, []byte(canonicalURL), []byte(base))
	}
	return content
}
