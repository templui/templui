package charts

import (
	"embed"
	"strings"
)

// chartSources embeds the chart templ sources for the code viewer sheet,
// the pendant of shadcn's registry file content in ChartCodeViewer.
//
//go:embed chart_*.templ
var chartSources embed.FS

// Source returns the templ source of a chart by its registry name,
// e.g. "chart-bar-default" -> chart_bar_default.templ.
func Source(name string) string {
	b, err := chartSources.ReadFile(strings.ReplaceAll(name, "-", "_") + ".templ")
	if err != nil {
		return ""
	}
	return string(b)
}
