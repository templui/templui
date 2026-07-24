---
title: Textarea
description: Displays a form textarea or a component that looks like a textarea.
---

<ComponentPreview name="textarea-demo" previewClassName="*:max-w-xs" />

## Installation

<Installation name="textarea" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/textarea"
```

```templ showLineNumbers
@textarea.Textarea()
```

## Field

Use `Field`, `FieldLabel`, and `FieldDescription` to create a textarea with a label and description.

<ComponentPreview name="textarea-field" previewClassName="*:max-w-xs" />

## Disabled

Use the `Disabled` prop to disable the textarea. To style the disabled state, set `Disabled` on the `field.Field` component.

<ComponentPreview name="textarea-disabled" previewClassName="*:max-w-xs" />

## Invalid

Use `aria-invalid` to mark the textarea as invalid. To style the invalid state, set `Invalid` on the `field.Field` component.

<ComponentPreview name="textarea-invalid" previewClassName="*:max-w-xs" />

## Button

Pair with `Button` to create a textarea with a submit button.

<ComponentPreview name="textarea-button" previewClassName="*:max-w-xs" />

## API Reference

### Textarea

The `Textarea` component renders a native textarea element.

| Prop          | Type     | Default |
| ------------- | -------- | ------- |
| `Name`        | `string` | -       |
| `Value`       | `string` | -       |
| `Placeholder` | `string` | -       |
| `Rows`        | `int`    | -       |
| `Disabled`    | `bool`   | `false` |
| `Readonly`    | `bool`   | `false` |
| `Required`    | `bool`   | `false` |
| `Class`       | `string` | -       |
