---
title: Label
description: Renders an accessible label associated with controls.
---

<ComponentPreview name="label-demo" />

## Installation

<Installation name="label" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/label"
```

```templ showLineNumbers
@label.Label(label.Props{For: "email"}) {
	Your email address
}
```

## Label in Field

For form fields, use the [Field](/docs/components/field) component which includes built-in `field.Label`, `field.Description`, and `field.Error` components.

```templ showLineNumbers
@field.Field() {
	@field.Label(field.LabelProps{For: "email"}) {
		Your email address
	}
	@input.Input(input.Props{ID: "email"})
}
```

<ComponentPreview name="field-demo" previewClassName="h-[44rem]" />

## API Reference

### Label

The `Label` component renders a native label associated with a control.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `For`   | `string` | -       |
| `Class` | `string` | -       |
