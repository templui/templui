package chart

import "encoding/json"

// Model describes one rendered chart for chart.js: the client runtime
// re-renders the SVG at real container pixels (Recharts'
// ResponsiveContainer behavior) and drives tooltip and cursor from it.
type Model struct {
	Kind          string        `json:"kind"` // "bar" | "area" | "pie"
	MarginTop     float64       `json:"marginTop"`
	MarginRight   float64       `json:"marginRight"`
	MarginBottom  float64       `json:"marginBottom"`
	MarginLeft    float64       `json:"marginLeft"`
	XAxisHeight   float64       `json:"xAxisHeight,omitempty"`
	TickMargin    float64       `json:"tickMargin,omitempty"`
	MinTickGap    float64       `json:"minTickGap,omitempty"`
	LegendHeight  float64       `json:"legendHeight,omitempty"`
	CategoryGap   float64       `json:"categoryGap,omitempty"`
	Radius        float64       `json:"radius,omitempty"`
	Stacked       bool          `json:"stacked,omitempty"`
	Gradient      bool          `json:"gradient,omitempty"`
	Cursor        bool          `json:"cursor"`
	Labels        []string      `json:"labels"`
	TooltipLabels []string      `json:"tooltipLabels,omitempty"`
	SliceColors   []string      `json:"sliceColors,omitempty"` // pie: color per slice
	Series        []ModelSeries `json:"series"`
	Tooltip       TooltipModel  `json:"tooltip"`
	// Pie geometry for the client renderer.
	InnerRadius float64 `json:"innerRadius,omitempty"`
	StrokeWidth float64 `json:"strokeWidth,omitempty"`
	ActiveIndex int     `json:"activeIndex,omitempty"`
	ActiveRing  bool    `json:"activeRing,omitempty"`
	CenterValue string  `json:"centerValue,omitempty"`
	CenterLabel string  `json:"centerLabel,omitempty"`
}

// ModelSeries is one data series with its resolved color variable.
type ModelSeries struct {
	Key         string    `json:"key"`
	Label       string    `json:"label"`
	Color       string    `json:"color"`
	Values      []float64 `json:"values"`
	FillOpacity float64   `json:"fillOpacity,omitempty"` // areas: 0 uses Recharts' 0.6
}

// TooltipModel mirrors ChartTooltipContent's props.
type TooltipModel struct {
	Indicator string `json:"indicator,omitempty"` // "dot" (default) | "line" | "dashed"
	HideLabel bool   `json:"hideLabel,omitempty"`
	Width     string `json:"width,omitempty"` // extra class, e.g. "w-[150px]"
}

// ModelScript renders the embedded JSON payload chart.js reads.
func ModelScript(m Model) string {
	b, err := json.Marshal(m)
	if err != nil {
		return ""
	}
	return `<script type="application/json" data-tui-chart-model>` + string(b) + `</script>`
}
