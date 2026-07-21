---
title: Icon
description: A wrapper for Lucide Icons that is primarily styled with Tailwind utility classes.
---

<ComponentPreview name="icon-demo" />

## Installation

<Installation name="icon" />

## Usage

```go
import "github.com/templui/templui/components/icon"
```

```templ
@icon.User(icon.Props{Class: "size-6"})
```

Browse the [Lucide library](https://lucide.dev/icons) to see every available icon, each one exists as a Go function with the PascalCase name of the icon.

## Colored

Use text color utilities to color an icon.

<ComponentPreview name="icon-colored" />

## Filled

Use `fill-current` to fill an icon with the current text color.

<ComponentPreview name="icon-filled" />

## Sizes

Use size utilities to scale an icon.

<ComponentPreview name="icon-sizes" />

## API Reference

### Icon

Every Lucide icon is a templ component, `icon.User`, `icon.ChevronDown`, and so on.

| Prop         | Type               | Default |
| ------------ | ------------------ | ------- |
| `Class`      | `string`           | -       |
| `Attributes` | `templ.Attributes` | -       |
