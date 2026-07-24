---
title: Tabs
description: A set of layered sections of content—known as tab panels—that are displayed one at a time.
---

<ComponentPreview name="tabs-demo" />

## Installation

<Installation name="tabs" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/tabs"
```

```templ showLineNumbers
@tabs.Tabs(tabs.Props{DefaultValue: "account"}) {
	@tabs.List() {
		@tabs.Trigger(tabs.TriggerProps{Value: "account"}) {
			Account
		}
		@tabs.Trigger(tabs.TriggerProps{Value: "password"}) {
			Password
		}
	}
	@tabs.Content(tabs.ContentProps{Value: "account"}) {
		Account content.
	}
	@tabs.Content(tabs.ContentProps{Value: "password"}) {
		Password content.
	}
}
```

## Composition

Use the following composition to build `Tabs`:

```text
tabs.Tabs
├── tabs.List
│   ├── tabs.Trigger
│   └── tabs.Trigger
├── tabs.Content
└── tabs.Content
```

## Line

Use the `Variant: tabs.VariantLine` prop on `tabs.List` for a line style.

<ComponentPreview name="tabs-line" />

## Vertical

Use `Orientation: tabs.OrientationVertical` for vertical tabs.

<ComponentPreview name="tabs-vertical" />

## Disabled

<ComponentPreview name="tabs-disabled" />

## Icons

<ComponentPreview name="tabs-icons" />

## API Reference

### Tabs

The `tabs.Tabs` component is the root, it shares the tabs id with list, triggers and contents.

| Prop           | Type                                           | Default      |
| -------------- | ---------------------------------------------- | ------------ |
| `DefaultValue` | `string`                                       | -            |
| `Orientation`  | `OrientationHorizontal \| OrientationVertical` | `horizontal` |
| `Class`        | `string`                                       | -            |

### TabsList

The `tabs.List` component wraps the triggers.

| Prop      | Type                            | Default   |
| --------- | ------------------------------- | --------- |
| `Variant` | `VariantDefault \| VariantLine` | `default` |
| `Class`   | `string`                        | -         |

### TabsTrigger

The `tabs.Trigger` component activates its tab panel.

| Prop       | Type     | Default |
| ---------- | -------- | ------- |
| `Value`    | `string` | -       |
| `Disabled` | `bool`   | `false` |
| `Class`    | `string` | -       |

### TabsContent

The `tabs.Content` component is the tab panel.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Value` | `string` | -       |
| `Class` | `string` | -       |
