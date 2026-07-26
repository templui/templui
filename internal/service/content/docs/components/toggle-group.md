---
title: Toggle Group
description: A set of two-state buttons that can be toggled on or off.
---

<ComponentPreview name="toggle-group-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
templui add togglegroup
```

Load the script once in your layout:

```templ
<head>
  @togglegroup.Script()
</head>
```

</TabsContent>

<TabsContent value="manual">

<Steps className="mb-0 pt-2">

<Step>Copy and paste the following code into your project.</Step>

<ComponentSource name="togglegroup" title="components/togglegroup/togglegroup.templ" />

Copy `togglegroup.min.js` as well, or minify `togglegroup.js` yourself. `togglegroup.Script()` loads the minified file.

<Step>Add the script once to your layout.</Step>

```templ
<head>
  @togglegroup.Script()
</head>
```

<Step>Update the import paths to match your project setup.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/togglegroup"
```

```templ showLineNumbers
@togglegroup.ToggleGroup(togglegroup.Props{Type: togglegroup.TypeSingle}) {
	@togglegroup.Item(togglegroup.ItemProps{Value: "a"}) {
		A
	}
	@togglegroup.Item(togglegroup.ItemProps{Value: "b"}) {
		B
	}
	@togglegroup.Item(togglegroup.ItemProps{Value: "c"}) {
		C
	}
}
```

## Composition

Use the following composition to build a `ToggleGroup`:

```text
togglegroup.ToggleGroup
├── togglegroup.Item
└── togglegroup.Item
```

## Outline

Use `Variant: togglegroup.VariantOutline` for an outline style.

<ComponentPreview name="toggle-group-outline" />

## Size

Use the `Size` prop to change the size of the toggle group.

<ComponentPreview name="toggle-group-sizes" />

## Spacing

Use `Spacing` to add spacing between toggle group items.

<ComponentPreview name="toggle-group-spacing" />

## Vertical

Use `Orientation: togglegroup.OrientationVertical` for vertical toggle groups.

<ComponentPreview name="toggle-group-vertical" />

## Disabled

<ComponentPreview name="toggle-group-disabled" />

## Custom

A custom toggle group example.

<ComponentPreview name="toggle-group-font-weight-selector" previewClassName="*:data-[slot=field]:max-w-xs" />

## API Reference

### ToggleGroup

The `togglegroup.ToggleGroup` component wraps its items into a single or multiple selection group.

| Prop          | Type                                          | Default      |
| ------------- | --------------------------------------------- | ------------ |
| `Type`        | `TypeSingle \| TypeMultiple`                  | `single`     |
| `Variant`     | `VariantDefault \| VariantOutline`            | `default`    |
| `Size`        | `SizeDefault \| SizeSm \| SizeLg`             | `default`    |
| `Spacing`     | `*int`                                        | `0`          |
| `Orientation` | `OrientationHorizontal \| OrientationVertical` | `horizontal` |
| `Disabled`    | `bool`                                        | `false`      |
| `Class`       | `string`                                      | -            |
