---
title: Hover Card
description: For sighted users to preview content available behind a link.
---

<ComponentPreview name="hover-card-demo" previewClassName="h-80" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
templui add hovercard
```

Load the script once in your layout:

```templ
<head>
  @hovercard.Script()
</head>
```

</TabsContent>

<TabsContent value="manual">

<Steps className="mb-0 pt-2">

<Step>Copy and paste the following code into your project.</Step>

<ComponentSource name="hovercard" title="components/hovercard/hovercard.templ" />

<ComponentSource name="hovercard" title="components/hovercard/hovercard.js" />

<ComponentSource name="hovercard" title="components/floatingui/floating_ui_core.js" />

<ComponentSource name="hovercard" title="components/floatingui/floating_ui_dom.js" />

Copy `hovercard.min.js` as well, or minify `hovercard.js` yourself. `hovercard.Script()` loads the minified file.

<Step>Add the script once to your layout.</Step>

```templ
<head>
  @hovercard.Script()
</head>
```

<Step>Update the import paths to match your project setup.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/hovercard"
```

```templ showLineNumbers
@hovercard.HoverCard() {
	<span { hovercard.Trigger(ctx)... }>Hover</span>
	@hovercard.Content() {
		The Go templating language, created and maintained by @a-h.
	}
}
```

## Composition

Use the following composition to build a `HoverCard`:

```text
hovercard.HoverCard
├── hovercard.Trigger
└── hovercard.Content
```

## Trigger Delays

Use `OpenDelay` and `CloseDelay` on the root to control when the card opens and closes.

```templ showLineNumbers
@hovercard.HoverCard(hovercard.Props{OpenDelay: 100, CloseDelay: 200}) {
	<span { hovercard.Trigger(ctx)... }>Hover</span>
	@hovercard.Content() {
		Content
	}
}
```

## Positioning

Use the `Side` and `Align` props on `hovercard.Content` to control placement.

```templ showLineNumbers
@hovercard.HoverCard() {
	<span { hovercard.Trigger(ctx)... }>Hover</span>
	@hovercard.Content(hovercard.ContentProps{Side: hovercard.SideTop, Align: hovercard.AlignStart}) {
		Content
	}
}
```

## Basic

<ComponentPreview name="hover-card-demo" previewClassName="h-80" />

## Sides

<ComponentPreview name="hover-card-sides" previewClassName="h-[22rem]" />

## API Reference

### HoverCard

The `HoverCard` component is the root that links trigger and content and controls the hover delays.

| Prop         | Type  | Default |
| ------------ | ----- | ------- |
| `OpenDelay`  | `int` | `700`   |
| `CloseDelay` | `int` | `300`   |

### Trigger

`hovercard.Trigger(ctx)` returns the attributes that turn any element into the trigger.

| Prop  | Type              | Default |
| ----- | ----------------- | ------- |
| `ctx` | `context.Context` | -       |

### Content

The `hovercard.Content` component is the card, anchored to the trigger.

| Prop          | Type                                                    | Default      |
| ------------- | ------------------------------------------------------- | ------------ |
| `Side`        | `SideTop \| SideRight \| SideBottom \| SideLeft`   | `SideBottom` |
| `Align`       | `AlignStart \| AlignCenter \| AlignEnd`             | `AlignCenter`|
| `SideOffset`  | `int`                                                   | `4`          |
| `AlignOffset` | `int`                                                   | `4`          |
| `Class`       | `string`                                                | -            |
