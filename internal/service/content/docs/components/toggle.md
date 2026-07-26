---
title: Toggle
description: A two-state button that can be either on or off.
---

<ComponentPreview name="toggle-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
templui add toggle
```

Load the script once in your layout:

```templ
<head>
  @toggle.Script()
</head>
```

</TabsContent>

<TabsContent value="manual">

<Steps className="mb-0 pt-2">

<Step>Copy and paste the following code into your project.</Step>

<ComponentSource name="toggle" title="components/toggle/toggle.templ" />

<ComponentSource name="toggle" title="components/toggle/toggle.js" />

Copy `toggle.min.js` as well, or minify `toggle.js` yourself. `toggle.Script()` loads the minified file.

<Step>Add the script once to your layout.</Step>

```templ
<head>
  @toggle.Script()
</head>
```

<Step>Update the import paths to match your project setup.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/toggle"
```

```templ showLineNumbers
@toggle.Toggle() {
	Toggle
}
```

## Outline

Use `Variant: toggle.VariantOutline` for an outline style.

<ComponentPreview name="toggle-outline" />

## With Text

<ComponentPreview name="toggle-text" />

## Size

Use the `Size` prop to change the size of the toggle.

<ComponentPreview name="toggle-sizes" />

## Disabled

<ComponentPreview name="toggle-disabled" />

## API Reference

### Toggle

The `Toggle` component renders a pressable two-state button.

| Prop       | Type                                    | Default   |
| ---------- | --------------------------------------- | --------- |
| `Pressed`  | `bool`                                  | `false`   |
| `Value`    | `string`                                | -         |
| `Variant`  | `VariantDefault \| VariantOutline`      | `default` |
| `Size`     | `SizeDefault \| SizeSm \| SizeLg`       | `default` |
| `Disabled` | `bool`                                  | `false`   |
| `Class`    | `string`                                | -         |
