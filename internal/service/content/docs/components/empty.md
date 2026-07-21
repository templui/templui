---
title: Empty
description: Use the Empty component to display a empty state.
---

<ComponentPreview name="empty-demo" previewClassName="h-96 p-0" />

## Installation

<Installation name="empty" />

## Usage

```go
import "github.com/templui/templui/components/empty"
```

```templ
@empty.Empty() {
	@empty.Header() {
		@empty.Media(empty.MediaProps{Variant: empty.MediaVariantIcon}) {
			@icon.FolderOpen()
		}
		@empty.Title() {
			No data
		}
		@empty.Description() {
			No data found
		}
	}
	@empty.Content() {
		@button.Button() {
			Add data
		}
	}
}
```

## Composition

Use the following composition to build an `Empty` state:

```text
empty.Empty
├── empty.Header
│   ├── empty.Media
│   ├── empty.Title
│   └── empty.Description
└── empty.Content
```

## Outline

Use the `border` utility class to create an outline empty state.

<ComponentPreview name="empty-outline" previewClassName="h-96 p-6 md:p-10" />

## Background

Use the `bg-*` and `bg-gradient-*` utilities to add a background to the empty state.

<ComponentPreview name="empty-background" previewClassName="h-96 p-0" />

## Avatar

Use the `empty.Media` component to display an avatar in the empty state.

<ComponentPreview name="empty-avatar" previewClassName="h-96 p-0" />

## Avatar Group

Use the `empty.Media` component to display an avatar group in the empty state.

<ComponentPreview name="empty-avatar-group" previewClassName="h-96 p-0" />

## InputGroup

You can add an `inputgroup.InputGroup` component to the `empty.Content` component.

<ComponentPreview name="empty-input-group" previewClassName="h-96 p-0" />

## API Reference

### Empty

The main component of the empty state. Wraps the `empty.Header` and `empty.Content` components.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

```templ
@empty.Empty() {
	@empty.Header()
	@empty.Content()
}
```

### Header

The `empty.Header` component holds the media, title and description.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Media

The `empty.Media` component displays an icon, avatar or other media above the title.

| Prop      | Type                                          | Default               |
| --------- | --------------------------------------------- | --------------------- |
| `Variant` | `MediaVariantDefault \| MediaVariantIcon`  | `MediaVariantDefault` |
| `Class`   | `string`                                      | -                     |

### Title

The `empty.Title` component is the empty state title.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Description

The `empty.Description` component is the empty state description.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Content

The `empty.Content` component holds actions or additional content below the header.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |
