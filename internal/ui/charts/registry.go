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
