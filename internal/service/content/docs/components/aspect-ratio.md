---
title: Aspect Ratio
description: Displays content within a desired ratio.
---

<ComponentPreview name="aspect-ratio-demo" />

## Installation

<Installation name="aspectratio" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/aspectratio"
```

```templ showLineNumbers
@aspectratio.AspectRatio(aspectratio.Props{Ratio: "16/9"}) {
	<img src="..." alt="Image" class="absolute inset-0 h-full w-full rounded-md object-cover"/>
}
```

## Square

A square aspect ratio component using the `Ratio: "1/1"` prop. This is useful for displaying images in a square format.

<ComponentPreview name="aspect-ratio-square" />

## Portrait

A portrait aspect ratio component using the `Ratio: "9/16"` prop. This is useful for displaying images in a portrait format.

<ComponentPreview name="aspect-ratio-portrait" previewClassName="h-96" />

## API Reference

### AspectRatio

The `AspectRatio` component displays content within a desired ratio.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Ratio` | `string` | -       |
| `Class` | `string` | -       |
