package main

import (
	"encoding/xml"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"time"
)

// URL represents an entry in the sitemap
type URL struct {
	XMLName    xml.Name `xml:"url"`
	Loc        string   `xml:"loc"`
	LastMod    string   `xml:"lastmod,omitempty"`
	ChangeFreq string   `xml:"changefreq,omitempty"`
	Priority   string   `xml:"priority,omitempty"`
}

// Sitemap represents the complete sitemap structure
type Sitemap struct {
	XMLName xml.Name `xml:"urlset"`
	XMLNS   string   `xml:"xmlns,attr"`
	URLs    []URL    `xml:"url"`
}

// Find paths (simplified, in real applications you would read all routes)
func findRoutes(routesFile string) ([]string, error) {
	// Read the Go file with route definitions
	content, err := os.ReadFile(routesFile)
	if err != nil {
		return nil, err
	}

	// Regular expression to find routes
	// Looks for patterns like `"GET /docs/components/button"`
	re := regexp.MustCompile(`"GET\s+(/[^"]*)"`)
	matches := re.FindAllStringSubmatch(string(content), -1)

	var routes []string
	for _, match := range matches {
		if len(match) > 1 {
			route := match[1]
			// Ignore sitemap and robots routes
			if route != "/sitemap.xml" && route != "/robots.txt" &&
				!regexp.MustCompile(`^/assets/`).MatchString(route) {
				routes = append(routes, route)
			}
		}
	}

	return routes, nil
}

func main() {
	// Command line arguments
	baseURL := flag.String("baseurl", "https://templui.io", "Base URL for the sitemap")
	outputFile := flag.String("output", "static/sitemap.xml", "Path to output file")
	routesFile := flag.String("routes", "cmd/docs/main.go", "Path to routes file")
	flag.Parse()

	// Create directory for output file
	os.MkdirAll(filepath.Dir(*outputFile), 0755)

	// Find routes
	routes, err := findRoutes(*routesFile)
	if err != nil {
		log.Fatalf("Error reading routes: %v", err)
	}

	// Create sitemap
	sitemap := Sitemap{
		XMLNS: "http://www.sitemaps.org/schemas/sitemap/0.9",
		URLs:  make([]URL, 0, len(routes)),
	}

	// Today's date for lastmod
	today := time.Now().Format("2006-01-02")

	// Priorities for different route types
	priorities := map[string]string{
		"/":      "1.0", // Homepage
		"/docs/": "0.8", // Documentation pages
	}

	// Change frequencies for different route types
	changeFreqs := map[string]string{
		"/":      "daily", // Homepage
		"/docs/": "daily", // Documentation pages
	}

	// Add URLs to sitemap
	for _, route := range routes {
		// Set priority based on route type
		priority := "0.5" // Default priority
		for prefix, p := range priorities {
			// Check length before slicing
			if route == prefix || (prefix != "/" && route != "/" && len(route) >= len(prefix) && route[:len(prefix)] == prefix) {
				priority = p
				break
			}
		}

		// Set change frequency based on route type
		changeFreq := "daily" // Default frequency
		for prefix, cf := range changeFreqs {
			// Check length before slicing
			if route == prefix || (prefix != "/" && route != "/" && len(route) >= len(prefix) && route[:len(prefix)] == prefix) {
				changeFreq = cf
				break
			}
		}

		sitemap.URLs = append(sitemap.URLs, URL{
			Loc:        *baseURL + route,
			LastMod:    today,
			ChangeFreq: changeFreq,
			Priority:   priority,
		})
	}

	// Open file for writing
	file, err := os.Create(*outputFile)
	if err != nil {
		log.Fatalf("Error creating sitemap file: %v", err)
	}
	defer file.Close()

	// Write XML header
	file.WriteString(xml.Header)

	// Write sitemap to file
	encoder := xml.NewEncoder(file)
	encoder.Indent("", "  ")
	if err := encoder.Encode(sitemap); err != nil {
		log.Fatalf("Error writing sitemap: %v", err)
	}

	fmt.Printf("Sitemap with %d URLs successfully written to %s.\n", len(sitemap.URLs), *outputFile)

}
