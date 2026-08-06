// Command inline expands the cn-* marker classes of a .templ source into the
// flat Tailwind utilities of a chosen style (the Go pendant to shadcn's
// registry style build) and prints the result to stdout.
//
// Usage, from the repo root:
//
//	go run ./cmd/inline -style nova -file components/button/button.templ
//	go run ./cmd/inline -style vega -component button -rtl
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/axadrn/shadcn-templ/v2/internal/inliner"
)

func main() {
	style := flag.String("style", "", "style name (vega, nova, lyra, maia, mira, luma, sera, rhea)")
	component := flag.String("component", "", "component name, resolves to components/<name>/<name>.templ")
	file := flag.String("file", "", "path to a .templ file (alternative to -component)")
	rtl := flag.Bool("rtl", false, "RTL build: cn-rtl-flip becomes rtl:rotate-180 instead of being stripped")
	flag.Parse()

	if *style == "" {
		fatal("missing -style")
	}
	path := *file
	if path == "" {
		if *component == "" {
			fatal("pass -component <name> or -file <path>")
		}
		path = filepath.Join("components", *component, *component+".templ")
	}

	css, err := os.ReadFile(filepath.Join("assets", "css", "styles", "style-"+*style+".css"))
	if err != nil {
		fatal("read style css: %v", err)
	}
	styleMap, err := inliner.CreateStyleMap(string(css))
	if err != nil {
		fatal("parse style css: %v", err)
	}

	src, err := os.ReadFile(path)
	if err != nil {
		fatal("read templ source: %v", err)
	}
	out, err := inliner.TransformStyle(string(src), styleMap, inliner.Options{RTL: *rtl})
	if err != nil {
		fatal("inline: %v", err)
	}
	fmt.Print(out)
}

func fatal(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "inline: "+format+"\n", args...)
	os.Exit(1)
}
