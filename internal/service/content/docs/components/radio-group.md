---
title: Radio Group
description: A set of checkable buttons, known as radio buttons, where no more than one of the buttons can be checked at a time.
---

<ComponentPreview name="radio-group-demo" />

## Installation

<Installation name="radiogroup" />

## Usage

```go showLineNumbers
import (
	"github.com/templui/templui/components/label"
	"github.com/templui/templui/components/radio"
)
```

```templ showLineNumbers
@radiogroup.RadioGroup(radiogroup.Props{Value: "option-one"}) {
	<div class="flex items-center gap-3">
		@radiogroup.Item(radiogroup.ItemProps{ID: "option-one", Value: "option-one"})
		@label.Label(label.Props{For: "option-one"}) {
			Option One
		}
	</div>
	<div class="flex items-center gap-3">
		@radiogroup.Item(radiogroup.ItemProps{ID: "option-two", Value: "option-two"})
		@label.Label(label.Props{For: "option-two"}) {
			Option Two
		}
	</div>
}
```

## Composition

Use the following composition to build a `RadioGroup`:

```text
radiogroup.RadioGroup
├── radiogroup.Item
└── radiogroup.Item
```

## Description

Radio group items with a description using the `Field` component.

<ComponentPreview name="radio-group-description" />

## Choice Card

Use `field.Label` to wrap the entire `field.Field` for a clickable card-style selection.

<ComponentPreview name="radio-group-choice-card" />

## Fieldset

Use `field.Set` and `field.Legend` to group radio items with a label and description.

<ComponentPreview name="radio-group-fieldset" />

## Disabled

Use the `Disabled` prop on `radiogroup.RadioGroup` to disable all items.

<ComponentPreview name="radio-group-disabled" />

## Invalid

Use `aria-invalid` on `radiogroup.Item` and `Invalid` on `field.Field` to show validation errors.

<ComponentPreview name="radio-group-invalid" />

## API Reference

### RadioGroup

The `radiogroup.RadioGroup` component shares the name and the selected value with its items.

| Prop       | Type     | Default |
| ---------- | -------- | ------- |
| `Name`     | `string` | random  |
| `Value`    | `string` | -       |
| `Disabled` | `bool`   | `false` |
| `Class`    | `string` | -       |

### RadioGroupItem

The `radiogroup.Item` component is a single radio button with a hidden native input.

| Prop       | Type     | Default |
| ---------- | -------- | ------- |
| `Name`     | `string` | group   |
| `Value`    | `string` | -       |
| `Checked`  | `bool`   | `false` |
| `Disabled` | `bool`   | `false` |
| `Form`     | `string` | -       |
| `Class`    | `string` | -       |
