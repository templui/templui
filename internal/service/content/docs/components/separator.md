---
title: Separator
description: Visually or semantically separates content.
---

<ComponentPreview name="separator-demo" />

## Installation

<Installation name="separator" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/separator"
```

```templ showLineNumbers
@separator.Separator()
```

## Vertical

Use `Orientation: separator.OrientationVertical` for a vertical separator.

<ComponentPreview name="separator-vertical" />

## Menu

Vertical separators between menu items with descriptions.

<ComponentPreview name="separator-menu" />

## List

Horizontal separators between list items.

<ComponentPreview name="separator-list" />

## API Reference

### Separator

The `Separator` component renders a semantic divider.

| Prop          | Type                                             | Default                 |
| ------------- | ------------------------------------------------ | ----------------------- |
| `Orientation` | `OrientationHorizontal \| OrientationVertical`   | `OrientationHorizontal` |
| `Class`       | `string`                                         | -                       |
