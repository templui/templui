---
title: Checkbox
description: A control that allows the user to toggle between checked and not checked.
---

<ComponentPreview name="checkbox-demo" previewClassName="h-80" />

## Installation

<Installation name="checkbox" />

## Usage

```go
import "github.com/templui/templui/components/checkbox"
```

```templ
@checkbox.Checkbox()
```

## Checked State

Use the `Checked` prop to render the checkbox checked initially.

```templ showLineNumbers
@checkbox.Checkbox(checkbox.Props{Checked: true})
```

## Invalid State

Set `aria-invalid` on the checkbox and `data-invalid` on the field wrapper to show the invalid styles.

<ComponentPreview name="checkbox-invalid" />

## Basic

Pair the checkbox with `field.Field` and `field.Label` for proper layout and labeling.

<ComponentPreview name="checkbox-basic" />

## Description

Use `field.Content` and `field.Description` for helper text.

<ComponentPreview name="checkbox-description" />

## Disabled

Use the `Disabled` prop to prevent interaction and add the `data-disabled` attribute to the `field.Field` component for disabled styles.

<ComponentPreview name="checkbox-disabled" />

## Group

Use multiple fields to create a checkbox list.

<ComponentPreview name="checkbox-group" />

## Table

<ComponentPreview name="checkbox-table" previewClassName="p-4 md:p-8" />

## API Reference

### Checkbox

The `Checkbox` component is a control that toggles between checked and not checked.

| Prop       | Type     | Default |
| ---------- | -------- | ------- |
| `Name`     | `string` | -       |
| `Value`    | `string` | -       |
| `Checked`  | `bool`   | `false` |
| `Disabled` | `bool`   | `false` |
| `Form`     | `string` | -       |
| `Class`    | `string` | -       |
