---
title: Pagination
description: Pagination with page navigation, next and previous links.
---

<ComponentPreview name="pagination-demo" />

## Installation

<Installation name="pagination" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/pagination"
```

```templ showLineNumbers
@pagination.Pagination() {
	@pagination.Content() {
		@pagination.Item() {
			@pagination.Previous(pagination.PreviousProps{Href: "#"})
		}
		@pagination.Item() {
			@pagination.Link(pagination.LinkProps{Href: "#"}) {
				1
			}
		}
		@pagination.Item() {
			@pagination.Link(pagination.LinkProps{Href: "#", IsActive: true}) {
				2
			}
		}
		@pagination.Item() {
			@pagination.Ellipsis()
		}
		@pagination.Item() {
			@pagination.Next(pagination.NextProps{Href: "#"})
		}
	}
}
```

## Composition

Use the following composition to build a `Pagination`:

```text
pagination.Pagination
└── pagination.Content
    ├── pagination.Item
    │   └── pagination.Previous
    ├── pagination.Item
    │   └── pagination.Link
    ├── pagination.Item
    │   └── pagination.Ellipsis
    └── pagination.Item
        └── pagination.Next
```

## Simple

A simple pagination with only page numbers.

<ComponentPreview name="pagination-simple" />

## Icons Only

Use just the previous and next buttons without page numbers. This is useful for data tables with a rows per page selector.

<ComponentPreview name="pagination-icons-only" />

## API Reference

### Pagination

The `Pagination` component is the nav landmark that wraps the page controls.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### PaginationContent

The `pagination.Content` component is the list that holds the items.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### PaginationItem

The `pagination.Item` component wraps a single control.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### PaginationLink

The `pagination.Link` component is a page link, outlined while active.

| Prop       | Type     | Default |
| ---------- | -------- | ------- |
| `Href`     | `string` | -       |
| `IsActive` | `bool`   | `false` |
| `Disabled` | `bool`   | `false` |
| `Class`    | `string` | -       |

### PaginationPrevious

The `pagination.Previous` component links to the previous page.

| Prop       | Type     | Default    |
| ---------- | -------- | ---------- |
| `Href`     | `string` | -          |
| `Label`    | `string` | `Previous` |
| `Disabled` | `bool`   | `false`    |
| `Class`    | `string` | -          |

### PaginationNext

The `pagination.Next` component links to the next page.

| Prop       | Type     | Default |
| ---------- | -------- | ------- |
| `Href`     | `string` | -       |
| `Label`    | `string` | `Next`  |
| `Disabled` | `bool`   | `false` |
| `Class`    | `string` | -       |

### PaginationEllipsis

The `pagination.Ellipsis` component marks collapsed pages.

| Prop | Type | Default |
| ---- | ---- | ------- |
| -    | -    | -       |
