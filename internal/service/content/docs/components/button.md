---
title: Button
description: Displays a button or a component that looks like a button.
---

<ComponentPreview name="button-demo" />

## Installation

<Installation name="button" />

## Usage

```go
import "github.com/templui/templui/components/button"
```

```templ
@button.Button(button.Props{Variant: button.VariantOutline}) {
	Button
}
```

## Size

Use the `Size` prop to change the size of the button.

<ComponentPreview name="button-size" />

## Default

<ComponentPreview name="button-default" />

## Outline

<ComponentPreview name="button-outline" />

## Secondary

<ComponentPreview name="button-secondary" />

## Ghost

<ComponentPreview name="button-ghost" />

## Destructive

<ComponentPreview name="button-destructive" />

## Link

<ComponentPreview name="button-link" />

## Icon

<ComponentPreview name="button-icon" />

## With Icon

Remember to add the `data-icon="inline-start"` or `data-icon="inline-end"` attribute to the icon for the correct spacing.

<ComponentPreview name="button-with-icon" />

## Rounded

Use the `rounded-full` class to make the button rounded.

<ComponentPreview name="button-rounded" />

## Spinner

Render a spinner component inside the button to show a loading state. Remember to add the `data-icon="inline-start"` or `data-icon="inline-end"` attribute to the spinner for the correct spacing.

<ComponentPreview name="button-spinner" />

## Button Group

To create a button group, use the `buttongroup` component. See the [Button Group](/docs/components/button-group) documentation for more details.

<ComponentPreview name="button-group-demo" />

## As Link

Set the `Href` prop to render the button as a semantic link that looks like a button.

```templ
@button.Button(button.Props{Href: "/docs", Variant: button.VariantOutline}) {
	Documentation
}
```

## API Reference

### Button

The `Button` component is a wrapper around the `button` element that adds a variety of styles and functionality.

| Prop         | Type                                                                          | Default     |
| ------------ | ----------------------------------------------------------------------------- | ----------- |
| `Variant`    | `"default" \| "secondary" \| "outline" \| "ghost" \| "destructive" \| "link"` | `"default"` |
| `Size`       | `"default" \| "sm" \| "lg" \| "icon" \| "icon-sm"`                            | `"default"` |
| `Href`       | `string`                                                                      | `""`        |
| `Target`     | `string`                                                                      | `""`        |
| `Type`       | `"button" \| "submit" \| "reset"`                                             | `"button"`  |
| `Disabled`   | `bool`                                                                        | `false`     |
| `FullWidth`  | `bool`                                                                        | `false`     |
| `Class`      | `string`                                                                      | `""`        |
| `Attributes` | `templ.Attributes`                                                            | `nil`       |
