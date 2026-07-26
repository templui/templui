---
title: Chart
description: Beautiful charts. Built using templ. Copy and paste into your apps.
---

<ComponentPreview name="chart-demo" className="theme-blue [&_.preview]:h-auto [&_.preview]:p-0 [&_.preview]:lg:min-h-[404px] [&_.preview>div]:w-full [&_.preview>div]:border-none [&_.preview>div]:shadow-none" hideCode />

Introducing **Charts**. A collection of chart components that you can copy and paste into your apps.

Charts are designed to look great out of the box. They work well with the other components and are fully customizable to fit your project.

[Browse the Charts Library](/charts).

## Component

We use a small client runtime under the hood that draws Recharts compatible SVG and ports Recharts' and d3's exact algorithms.

We designed the chart component with composition in mind. **You build your charts using chart components and only bring in custom components, such as the tooltip, when and where you need it**.

```templ showLineNumbers /chart.Container/ /chart.Tooltip/
import "github.com/templui/templui/components/chart"

templ MyChart() {
	@chart.Container(chart.ContainerProps{Config: chartConfig}) {
		@chart.BarChart(chart.BarChartProps{Data: chartData}) {
			@chart.Bar(chart.BarProps{DataKey: "value"})
			@chart.Tooltip()
		}
	}
}
```

The chart elements mirror the Recharts composition one to one. This means you're not locked into a templUI abstraction: shadcn and Recharts chart examples translate directly, element for element.

The runtime watches the DOM, so charts arriving through htmx or Datastar swaps render out of the box, with no framework specific wiring.

**The components are yours**.

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
templui add chart
```

Load the script once in your layout:

```templ
<head>
  @chart.Script()
</head>
```

</TabsContent>

<TabsContent value="manual">

<Steps className="mb-0 pt-2">

<Step>Copy and paste the following code into your project.</Step>

<ComponentSource name="chart" title="components/chart/chart.templ" />

<ComponentSource name="chart" title="components/chart/chart.js" />

<Step>Add the following colors to your CSS file</Step>

```css title="assets/css/input.css" showLineNumbers
@layer base {
  :root {
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
    --chart-3: oklch(0.398 0.07 227.392);
    --chart-4: oklch(0.828 0.189 84.429);
    --chart-5: oklch(0.769 0.188 70.08);
  }

  .dark {
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
  }
}
```

Copy `chart.min.js` as well, or minify `chart.js` yourself. `chart.Script()` loads the minified file.

<Step>Add the script once to your layout.</Step>

```templ
<head>
  @chart.Script()
</head>
```

<Step>Update the import paths to match your project setup.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Your First Chart

Let's build your first chart. We'll build a bar chart, add a grid, axis, tooltip and legend.

<Steps>

<Step>Start by defining your data</Step>

The following data represents the number of desktop and mobile users for each month.

<Callout className="mt-4">

**Note:** Your data can be in any shape. You are not limited to the shape of the data below. Use the `DataKey` prop to map your data to the chart.

</Callout>

```go title="chart_example.templ" showLineNumbers
var chartData = []chart.Datum{
	{"month": "January", "desktop": 186, "mobile": 80},
	{"month": "February", "desktop": 305, "mobile": 200},
	{"month": "March", "desktop": 237, "mobile": 120},
	{"month": "April", "desktop": 73, "mobile": 190},
	{"month": "May", "desktop": 209, "mobile": 130},
	{"month": "June", "desktop": 214, "mobile": 140},
}
```

<Step>Define your chart config</Step>

The chart config holds configuration for the chart. This is where you place human-readable strings, such as labels, icons and color tokens for theming.

```go title="chart_example.templ" showLineNumbers
var chartConfig = chart.Config{
	{Key: "desktop", Label: "Desktop", Color: "#2563eb"},
	{Key: "mobile", Label: "Mobile", Color: "#60a5fa"},
}
```

<Step>Build your chart</Step>

You can now build your chart using the chart components.

<Callout className="mt-4 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-950">

**Important:** Remember to set a `min-h-[VALUE]` on the `Container` component. This is required for the chart to be responsive.

</Callout>

```templ title="chart_example.templ" showLineNumbers
@chart.Container(chart.ContainerProps{ID: "chart-example", Config: chartConfig, Class: "min-h-[200px] w-full"}) {
	@chart.BarChart(chart.BarChartProps{Data: chartData}) {
		@chart.Bar(chart.BarProps{DataKey: "desktop", Fill: "var(--color-desktop)", Radius: 4})
		@chart.Bar(chart.BarProps{DataKey: "mobile", Fill: "var(--color-mobile)", Radius: 4})
	}
}
```

<ComponentPreview name="chart-example" previewClassName="h-80" />

</Steps>

### Add a Grid

Let's add a grid to the chart.

<Steps className="mb-0 pt-2">

<Step>Add the `CartesianGrid` component to your chart.</Step>

```templ showLineNumbers {3}
@chart.Container(chart.ContainerProps{ID: "chart-example", Config: chartConfig, Class: "min-h-[200px] w-full"}) {
	@chart.BarChart(chart.BarChartProps{Data: chartData}) {
		@chart.CartesianGrid(chart.CartesianGridProps{Vertical: false})
		@chart.Bar(chart.BarProps{DataKey: "desktop", Fill: "var(--color-desktop)", Radius: 4})
		@chart.Bar(chart.BarProps{DataKey: "mobile", Fill: "var(--color-mobile)", Radius: 4})
	}
}
```

<ComponentPreview name="chart-example-grid" previewClassName="h-80" />

</Steps>

### Add an Axis

To add an x-axis to the chart, we'll use the `XAxis` component.

<Steps className="mb-0 pt-2">

<Step>Add the `XAxis` component to your chart.</Step>

```templ showLineNumbers {4-8}
@chart.Container(chart.ContainerProps{ID: "chart-example", Config: chartConfig, Class: "min-h-[200px] w-full"}) {
	@chart.BarChart(chart.BarChartProps{Data: chartData}) {
		@chart.CartesianGrid(chart.CartesianGridProps{Vertical: false})
		@chart.XAxis(chart.XAxisProps{
			DataKey:       "month",
			TickMargin:    10,
			TickFormatter: monthShort,
		})
		@chart.Bar(chart.BarProps{DataKey: "desktop", Fill: "var(--color-desktop)", Radius: 4})
		@chart.Bar(chart.BarProps{DataKey: "mobile", Fill: "var(--color-mobile)", Radius: 4})
	}
}
```

<ComponentPreview name="chart-example-axis" previewClassName="h-80" />

</Steps>

### Add Tooltip

So far we've only used components from the chart element set. They look great out of the box thanks to some customization in the `chart` component.

To add a tooltip, we'll use the custom `Tooltip` component from `chart`.

<Steps className="mb-0 pt-2">

<Step>Add the `Tooltip` component to your chart.</Step>

```templ showLineNumbers {9}
@chart.Container(chart.ContainerProps{ID: "chart-example", Config: chartConfig, Class: "min-h-[200px] w-full"}) {
	@chart.BarChart(chart.BarChartProps{Data: chartData}) {
		@chart.CartesianGrid(chart.CartesianGridProps{Vertical: false})
		@chart.XAxis(chart.XAxisProps{
			DataKey:       "month",
			TickMargin:    10,
			TickFormatter: monthShort,
		})
		@chart.Tooltip(chart.TooltipProps{Cursor: true})
		@chart.Bar(chart.BarProps{DataKey: "desktop", Fill: "var(--color-desktop)", Radius: 4})
		@chart.Bar(chart.BarProps{DataKey: "mobile", Fill: "var(--color-mobile)", Radius: 4})
	}
}
```

<ComponentPreview name="chart-example-tooltip" previewClassName="h-80" />

Hover to see the tooltips. Easy, right? One component, and we've got a beautiful tooltip.

</Steps>

### Add Legend

We'll do the same for the legend. We'll use the `Legend` component from `chart`.

<Steps className="mb-0 pt-2">

<Step>Add the `Legend` component to your chart.</Step>

```templ showLineNumbers {10}
@chart.Container(chart.ContainerProps{ID: "chart-example", Config: chartConfig, Class: "min-h-[200px] w-full"}) {
	@chart.BarChart(chart.BarChartProps{Data: chartData}) {
		@chart.CartesianGrid(chart.CartesianGridProps{Vertical: false})
		@chart.XAxis(chart.XAxisProps{
			DataKey:       "month",
			TickMargin:    10,
			TickFormatter: monthShort,
		})
		@chart.Tooltip(chart.TooltipProps{Cursor: true})
		@chart.Legend()
		@chart.Bar(chart.BarProps{DataKey: "desktop", Fill: "var(--color-desktop)", Radius: 4})
		@chart.Bar(chart.BarProps{DataKey: "mobile", Fill: "var(--color-mobile)", Radius: 4})
	}
}
```

<ComponentPreview name="chart-example-legend" previewClassName="h-80" />

</Steps>

Done. You've built your first chart! What's next?

- [Themes and Colors](/docs/components/chart#theming)
- [Tooltip](/docs/components/chart#tooltip)
- [Legend](/docs/components/chart#legend)

## Chart Config

The chart config is where you define the labels, icons and colors for a chart.

It is intentionally decoupled from chart data.

This allows you to share config and color tokens between charts. It can also work independently for cases where your data or color tokens live remotely or in a different format.

```go showLineNumbers /chart.Config/
import "github.com/templui/templui/components/icon"

var chartConfig = chart.Config{
	{
		Key:   "desktop",
		Label: "Desktop",
		Icon:  icon.Monitor(),
		// A color like "hsl(220, 98%, 61%)" or "var(--color-name)"
		Color: "#2563eb",
		// OR a theme with light and dark colors
		Theme: &chart.SeriesTheme{
			Light: "#2563eb",
			Dark:  "#dc2626",
		},
	},
}
```

## Theming

Charts have built-in support for theming. You can use css variables (recommended) or color values in any color format, such as hex, hsl or oklch.

### CSS Variables

<Steps className="mb-0 pt-2">

<Step>Define your colors in your css file</Step>

```css title="assets/css/input.css" showLineNumbers
@layer base {
  :root {
    --chart-1: oklch(0.646 0.222 41.116);
    --chart-2: oklch(0.6 0.118 184.704);
  }

  .dark {
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
  }
}
```

<Step>Add the color to your `chartConfig`</Step>

```go showLineNumbers
var chartConfig = chart.Config{
	{Key: "desktop", Label: "Desktop", Color: "var(--chart-1)"},
	{Key: "mobile", Label: "Mobile", Color: "var(--chart-2)"},
}
```

</Steps>

### hex, hsl or oklch

You can also define your colors directly in the chart config. Use the color format you prefer.

```go showLineNumbers
var chartConfig = chart.Config{
	{Key: "desktop", Label: "Desktop", Color: "#2563eb"},
	{Key: "mobile", Label: "Mobile", Color: "hsl(220, 98%, 61%)"},
	{Key: "tablet", Label: "Tablet", Color: "oklch(0.5 0.2 240)"},
	{Key: "laptop", Label: "Laptop", Color: "var(--chart-2)"},
}
```

### Using Colors

To use the theme colors in your chart, reference the colors using the format `var(--color-KEY)`.

#### Components

```templ
@chart.Bar(chart.BarProps{DataKey: "desktop", Fill: "var(--color-desktop)"})
```

#### Chart Data

```go showLineNumbers
var chartData = []chart.Datum{
	{"browser": "chrome", "visitors": 275, "fill": "var(--color-chrome)"},
	{"browser": "safari", "visitors": 200, "fill": "var(--color-safari)"},
}
```

## Tooltip

A chart tooltip contains a label, name, indicator and value. You can use a combination of these to customize your tooltip.

The tooltip trails the cursor inside the plot area and snaps to the active data point, and the colors are automatically referenced from the chart config.

You can turn the label on and off using the `HideLabel` prop and customize the indicator style using the `Indicator` prop. Use `NameKey` to use a custom key for the tooltip name.

Chart comes with the `Tooltip` component and its `TooltipContentProps`, the pendant of `ChartTooltip` and `ChartTooltipContent`. You can use these to add tooltips to your chart.

```templ
@chart.Tooltip(chart.TooltipProps{
	Cursor:  false,
	Content: chart.TooltipContentProps{Indicator: "line"},
})
```

### Props

`chart.TooltipProps`

| Prop      | Type                | Description                            |
| :-------- | :------------------ | :------------------------------------- |
| `Cursor`  | bool                | Show the hover cursor (band or line).  |
| `Content` | TooltipContentProps | The rendered tooltip content.          |

`chart.TooltipContentProps`

| Prop             | Type                     | Description                                    |
| :--------------- | :----------------------- | :--------------------------------------------- |
| `Indicator`      | `dot` `line` or `dashed` | The indicator style for the tooltip.           |
| `HideLabel`      | bool                     | Whether to hide the label.                     |
| `NameKey`        | string                   | Config key to use for the series name.         |
| `LabelFormatter` | func(any) string         | Formats the tooltip label.                     |
| `Class`          | string                   | Extra classes for the tooltip content.         |

### Custom

To use a custom key for the tooltip names, use the `NameKey` prop.

```go showLineNumbers /views/
var chartData = []chart.Datum{
	{"date": "2024-06-29", "views": 103},
	{"date": "2024-06-30", "views": 446},
}

var chartConfig = chart.Config{
	{Key: "views", Label: "Page Views"},
}
```

```templ
@chart.Tooltip(chart.TooltipProps{
	Content: chart.TooltipContentProps{NameKey: "views"},
})
```

This will use `Page Views` for the tooltip name.

## Legend

You can use the `Legend` component to add a legend to your chart.

```templ
@chart.Legend()
```

It renders the label and color of every series, and the colors are automatically referenced from the chart config. When a config entry sets an `Icon`, it replaces the color swatch.
