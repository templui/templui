---
title: Input
description: Displays a form input field or a component that looks like an input field.
---

<ComponentPreview name="input-demo" previewClassName="*:max-w-xs" />

## Installation

<Installation name="input" />

## Usage

```go
import "github.com/templui/templui/components/input"
```

```templ
@input.Input()
```

## Basic

<ComponentPreview name="input-basic" previewClassName="*:max-w-xs" />

## Field

Use `field.Field`, `field.Label`, and `field.Description` to create an input with a label and description.

<ComponentPreview name="input-field" previewClassName="*:max-w-xs" />

## Field Group

Use `field.Group` to show multiple `field.Field` blocks and to build forms.

<ComponentPreview name="input-fieldgroup" previewClassName="*:max-w-xs" />

## Disabled

Use the `Disabled` prop to disable the input. To style the disabled state, set `Disabled` on the `field.Field` component.

<ComponentPreview name="input-disabled" previewClassName="*:max-w-xs" />

## Invalid

Use `aria-invalid` to mark the input as invalid. To style the invalid state, set `Invalid` on the `field.Field` component.

<ComponentPreview name="input-invalid" previewClassName="*:max-w-xs" />

## File

Use the `Type: input.TypeFile` prop to create a file input.

<ComponentPreview name="input-file" previewClassName="*:max-w-xs" />

## Inline

Use `field.Field` with `Orientation: field.OrientationHorizontal` to create an inline input. Pair with `button.Button` to create a search input with a button.

<ComponentPreview name="input-inline" previewClassName="*:max-w-xs" />

## Grid

Use a grid layout to place multiple inputs side by side.

<ComponentPreview name="input-grid" previewClassName="p-6" />

## Required

Use the `Required` prop to indicate required inputs.

<ComponentPreview name="input-required" previewClassName="*:max-w-xs" />

## Badge

Use `Badge` in the label to highlight a recommended field.

<ComponentPreview name="input-badge" previewClassName="*:max-w-xs" />

## Input Group

To add icons, text, or buttons inside an input, use the `InputGroup` component. See the [Input Group](/docs/components/input-group) component for more examples.

<ComponentPreview name="input-input-group" previewClassName="*:max-w-xs" />

## Button Group

To add buttons to an input, use the `ButtonGroup` component. See the [Button Group](/docs/components/button-group) component for more examples.

<ComponentPreview name="input-button-group" previewClassName="*:max-w-xs" />

## Form

A full form example with multiple inputs, a select, and a button.

<ComponentPreview name="input-form" previewClassName="h-[32rem]" />

## API Reference

### Input

The `Input` component displays a native input element.

| Prop          | Type                                                                        | Default    |
| ------------- | ---------------------------------------------------------------------------- | ---------- |
| `Type`        | `TypeText \| TypePassword \| TypeEmail \| TypeNumber \| TypeTel \| ...` | `TypeText` |
| `Name`        | `string`                                                                    | -          |
| `Value`       | `string`                                                                    | -          |
| `Placeholder` | `string`                                                                    | -          |
| `Disabled`    | `bool`                                                                      | `false`    |
| `Readonly`    | `bool`                                                                      | `false`    |
| `Required`    | `bool`                                                                      | `false`    |
| `FileAccept`  | `string`                                                                    | -          |
| `Form`        | `string`                                                                    | -          |
| `Class`       | `string`                                                                    | -          |
