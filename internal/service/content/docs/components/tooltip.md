---
title: Tooltip
description: A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.
---

<ComponentPreview name="tooltip-demo" />

## Installation

<Installation name="tooltip" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/tooltip"
```

```templ showLineNumbers
@tooltip.Tooltip() {
	<button { tooltip.Trigger(ctx)... }>Hover</button>
	@tooltip.Content() {
		<p>Add to library</p>
	}
}
```

## Composition

Use the following composition to build a `Tooltip`:

```text
tooltip.Tooltip
├── tooltip.Trigger
└── tooltip.Content
```

## Side

Use the `Side` prop to change the position of the tooltip.

<ComponentPreview name="tooltip-sides" />

## With Keyboard Shortcut

<ComponentPreview name="tooltip-keyboard" />

## Disabled Button

Show a tooltip on a disabled button by wrapping it with a span.

<ComponentPreview name="tooltip-disabled" />

## API Reference

### Tooltip

The `tooltip.Tooltip` component is the root, it generates the id that links trigger and content.

### TooltipTrigger

`tooltip.Trigger(ctx)` returns the attributes that turn any element into the tooltip trigger.

### TooltipContent

The `tooltip.Content` component is the popup.

| Prop         | Type                                             | Default   |
| ------------ | ------------------------------------------------ | --------- |
| `Side`       | `SideTop \| SideRight \| SideBottom \| SideLeft` | `SideTop` |
| `SideOffset` | `int`                                            | `4`       |
| `Class`      | `string`                                         | -         |
