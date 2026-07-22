---
title: Switch
description: A control that allows the user to toggle between checked and not checked.
---

<ComponentPreview name="switch-demo" />

## Installation

<Installation name="switch" />

## Usage

```go showLineNumbers
import switchcomp "github.com/templui/templui/components/switch"
```

```templ showLineNumbers
@switchcomp.Switch()
```

## Description

<ComponentPreview name="switch-description" />

## Choice Card

Card-style selection where `field.Label` wraps the entire `field.Field` for a clickable card pattern.

<ComponentPreview name="switch-choice-card" />

## Disabled

Add the `Disabled` prop to the `Switch` component to disable the switch. Add the `Disabled` prop to the `field.Field` component for styling.

<ComponentPreview name="switch-disabled" />

## Invalid

Add the `aria-invalid` attribute to the `Switch` component to indicate an invalid state. Add the `Invalid` prop to the `field.Field` component for styling.

<ComponentPreview name="switch-invalid" />

## Size

Use the `Size` prop to change the size of the switch.

<ComponentPreview name="switch-sizes" />

## API Reference

### Switch

The `Switch` component renders the toggle with a hidden native checkbox that carries state and form participation.

| Prop       | Type                    | Default       |
| ---------- | ----------------------- | ------------- |
| `Name`     | `string`                | -             |
| `Value`    | `string`                | `on`          |
| `Checked`  | `bool`                  | `false`       |
| `Disabled` | `bool`                  | `false`       |
| `Form`     | `string`                | -             |
| `Size`     | `SizeDefault \| SizeSm` | `SizeDefault` |
| `Class`    | `string`                | -             |
