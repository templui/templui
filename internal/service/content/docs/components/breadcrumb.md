---
title: Breadcrumb
description: Displays the path to the current resource using a hierarchy of links.
---

<ComponentPreview name="breadcrumb-demo" previewClassName="p-2" />

## Installation

<Installation name="breadcrumb" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/breadcrumb"
```

```templ showLineNumbers
@breadcrumb.Breadcrumb() {
	@breadcrumb.List() {
		@breadcrumb.Item() {
			@breadcrumb.Link(breadcrumb.LinkProps{Href: "/"}) {
				Home
			}
		}
		@breadcrumb.Separator()
		@breadcrumb.Item() {
			@breadcrumb.Link(breadcrumb.LinkProps{Href: "/docs/components"}) {
				Components
			}
		}
		@breadcrumb.Separator()
		@breadcrumb.Item() {
			@breadcrumb.Page() {
				Breadcrumb
			}
		}
	}
}
```

## Composition

Use the following composition to build a `Breadcrumb`:

```text
breadcrumb.Breadcrumb
└── breadcrumb.List
    ├── breadcrumb.Item
    │   └── breadcrumb.Link
    ├── breadcrumb.Separator
    ├── breadcrumb.Item
    │   └── breadcrumb.Link
    ├── breadcrumb.Separator
    └── breadcrumb.Item
        └── breadcrumb.Page
```

## Basic

A basic breadcrumb with a home link and a components link.

<ComponentPreview name="breadcrumb-basic" />

## Custom separator

Set the `UseCustom` prop on `breadcrumb.Separator` and pass custom children to create a custom separator.

<ComponentPreview name="breadcrumb-separator" />

## Dropdown

You can compose `breadcrumb.Item` with a `dropdownmenu` to create a dropdown in the breadcrumb.

<ComponentPreview name="breadcrumb-dropdown" />

## Collapsed

We provide a `breadcrumb.Ellipsis` component to show a collapsed state when the breadcrumb is too long.

<ComponentPreview name="breadcrumb-ellipsis" previewClassName="p-2" />

## Link component

The `breadcrumb.Link` component renders a standard anchor. Set the `Href` prop to link a breadcrumb item.

<ComponentPreview name="breadcrumb-link" />

## API Reference

### Breadcrumb

The `Breadcrumb` component is the root navigation element that wraps all breadcrumb components.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### List

The `breadcrumb.List` component displays the ordered list of breadcrumb items.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Item

The `breadcrumb.Item` component wraps individual breadcrumb items.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Link

The `breadcrumb.Link` component displays a clickable link in the breadcrumb.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Href`  | `string` | -       |
| `Class` | `string` | -       |

### Page

The `breadcrumb.Page` component displays the current page in the breadcrumb (non-clickable).

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Separator

The `breadcrumb.Separator` component displays a separator between breadcrumb items. Set `UseCustom` and pass custom children to override the default separator icon.

| Prop        | Type     | Default |
| ----------- | -------- | ------- |
| `UseCustom` | `bool`   | `false` |
| `Class`     | `string` | -       |

### Ellipsis

The `breadcrumb.Ellipsis` component displays an ellipsis indicator for collapsed breadcrumb items.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |
