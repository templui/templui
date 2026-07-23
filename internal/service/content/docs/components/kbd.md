---
title: Kbd
description: Used to display textual user input from keyboard.
---

<ComponentPreview name="kbd-demo" />

## Installation

<Installation name="kbd" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/kbd"
```

```templ showLineNumbers
@kbd.Kbd() {
	Ctrl
}
```

## Composition

Use the following composition to build `Kbd` and `KbdGroup`:

```text
kbd.Kbd
kbd.Group
├── kbd.Kbd
└── kbd.Kbd
```

## Group

Use the `kbd.Group` component to group keyboard keys together.

<ComponentPreview name="kbd-group" />

## Button

Use the `Kbd` component inside a `Button` component to display a keyboard key inside a button.

<ComponentPreview name="kbd-button" />

## Tooltip

You can use the `Kbd` component inside a `Tooltip` component to display a tooltip with a keyboard key.

<ComponentPreview name="kbd-tooltip" />

## Input Group

You can use the `Kbd` component inside a `inputgroup.Addon` component to display a keyboard key inside an input group.

<ComponentPreview name="kbd-input-group" />

## API Reference

### Kbd

Use the `Kbd` component to display a keyboard key.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

```templ
@kbd.Kbd() {
	Ctrl
}
```

### KbdGroup

Use the `kbd.Group` component to group `Kbd` components together.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

```templ
@kbd.Group() {
	@kbd.Kbd() {
		Ctrl
	}
	@kbd.Kbd() {
		B
	}
}
```
