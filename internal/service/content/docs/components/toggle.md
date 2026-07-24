---
title: Toggle
description: A two-state button that can be either on or off.
---

<ComponentPreview name="toggle-demo" />

## Installation

<Installation name="toggle" />

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
