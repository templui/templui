---
title: Slider
description: An input where the user selects a value from within a given range.
---

<ComponentPreview name="slider-demo" />

## Installation

<Installation name="slider" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/slider"
```

```templ showLineNumbers
@slider.Slider(slider.Props{Values: []float64{33}, Max: 100, Step: 1})
```

## Range

Use an array with two values for a range slider.

<ComponentPreview name="slider-range" />

## Multiple Thumbs

Use an array with multiple values for multiple thumbs.

<ComponentPreview name="slider-multiple" />

## Vertical

Use `Orientation: slider.OrientationVertical` for a vertical slider.

<ComponentPreview name="slider-vertical" />

## Controlled

<ComponentPreview name="slider-controlled" />

## Disabled

Use the `Disabled` prop to disable the slider.

<ComponentPreview name="slider-disabled" />

## API Reference

### Slider

The `Slider` component renders one draggable thumb per value on a shared track.

| Prop          | Type                                             | Default                 |
| ------------- | ------------------------------------------------ | ----------------------- |
| `Values`      | `[]float64`                                      | `[Min, Max]`            |
| `Min`         | `float64`                                        | `0`                     |
| `Max`         | `float64`                                        | `100`                   |
| `Step`        | `float64`                                        | `1`                     |
| `Orientation` | `OrientationHorizontal \| OrientationVertical`   | `OrientationHorizontal` |
| `Name`        | `string`                                         | -                       |
| `Disabled`    | `bool`                                           | `false`                 |
| `Class`       | `string`                                         | -                       |
