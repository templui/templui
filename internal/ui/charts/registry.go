package charts

import "github.com/a-h/templ"

// Component resolves a gallery chart by its registry name for the /view
// iframe route, the pendant of shadcn's getRegistryComponent.
func Component(name string) templ.Component {
	switch name {
	case "chart-area-interactive":
		return ChartAreaInteractive()
	case "chart-area-default":
		return ChartAreaDefault()
	case "chart-area-linear":
		return ChartAreaLinear()
	case "chart-area-step":
		return ChartAreaStep()
	case "chart-area-legend":
		return ChartAreaLegend()
	case "chart-area-stacked":
		return ChartAreaStacked()
	case "chart-area-gradient":
		return ChartAreaGradient()
	case "chart-area-axes":
		return ChartAreaAxes()
	case "chart-area-icons":
		return ChartAreaIcons()
	case "chart-area-stacked-expand":
		return ChartAreaStackedExpand()
	case "chart-bar-interactive":
		return ChartBarInteractive()
	case "chart-bar-default":
		return ChartBarDefault()
	case "chart-pie-donut":
		return ChartPieDonut()
	case "chart-pie-interactive":
		return ChartPieInteractive()
	}
	return nil
}
