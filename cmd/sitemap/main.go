// Command sitemap generates static/sitemap.xml from the same sources the
// docs server registers its routes from: the static page list here,
// shared.DocSlugs (markdown docs pages), registry.Components() (component
// pages) and pages.ChartTypes (chart gallery categories). No source parsing,
// no redirects.
package main

import (
	"encoding/xml"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/axadrn/shadcn-templ/v2/internal/registry"
	"github.com/axadrn/shadcn-templ/v2/internal/shared"
	"github.com/axadrn/shadcn-templ/v2/internal/ui/pages"
)

// URL is an entry in the sitemap.
type URL struct {
	XMLName    xml.Name `xml:"url"`
	Loc        string   `xml:"loc"`
	LastMod    string   `xml:"lastmod,omitempty"`
	ChangeFreq string   `xml:"changefreq,omitempty"`
	Priority   string   `xml:"priority,omitempty"`
}

// Sitemap is the complete sitemap structure.
type Sitemap struct {
	XMLName xml.Name `xml:"urlset"`
	XMLNS   string   `xml:"xmlns,attr"`
	URLs    []URL    `xml:"url"`
}

func routes() []string {
	// Static pages with their own handlers in cmd/docs/main.go.
	out := []string{"/", "/create", "/typeset", "/docs/components"}

	for _, slug := range shared.DocSlugs {
		out = append(out, "/docs/"+slug)
	}

	// Changelog: the overview plus one page per entry (the reference's
	// per-entry directory).
	out = append(out, "/docs/changelog")
	entries, err := os.ReadDir("internal/service/content/docs/changelog")
	if err == nil {
		for _, entry := range entries {
			if name, ok := strings.CutSuffix(entry.Name(), ".md"); ok {
				out = append(out, "/docs/changelog/"+name)
			}
		}
	}

	for _, comp := range registry.Components() {
		out = append(out, "/docs/components/"+comp.Name)
	}

	var chartTypes []string
	for t := range pages.ChartTypes {
		chartTypes = append(chartTypes, t)
	}
	sort.Strings(chartTypes)
	for _, t := range chartTypes {
		out = append(out, "/charts/"+t)
	}

	return out
}

func priority(route string) string {
	switch {
	case route == "/":
		return "1.0"
	case strings.HasPrefix(route, "/docs"):
		return "0.8"
	default:
		return "0.5"
	}
}

func main() {
	baseURL := flag.String("baseurl", "https://templui.io", "Base URL for the sitemap")
	outputFile := flag.String("output", "static/sitemap.xml", "Path to output file")
	flag.Parse()

	os.MkdirAll(filepath.Dir(*outputFile), 0755)

	today := time.Now().Format("2006-01-02")

	sitemap := Sitemap{XMLNS: "http://www.sitemaps.org/schemas/sitemap/0.9"}
	for _, route := range routes() {
		sitemap.URLs = append(sitemap.URLs, URL{
			Loc:        *baseURL + route,
			LastMod:    today,
			ChangeFreq: "daily",
			Priority:   priority(route),
		})
	}

	file, err := os.Create(*outputFile)
	if err != nil {
		log.Fatalf("Error creating sitemap file: %v", err)
	}
	defer file.Close()

	file.WriteString(xml.Header)
	encoder := xml.NewEncoder(file)
	encoder.Indent("", "  ")
	if err := encoder.Encode(sitemap); err != nil {
		log.Fatalf("Error writing sitemap: %v", err)
	}

	fmt.Printf("Sitemap with %d URLs written to %s.\n", len(sitemap.URLs), *outputFile)
}
