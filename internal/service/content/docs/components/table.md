---
title: Table
description: A responsive table component.
---

<ComponentPreview name="table-demo" previewClassName="h-[30rem]" />

## Installation

<Installation name="table" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/table"
```

```templ showLineNumbers
@table.Table() {
	@table.Caption() {
		A list of your recent invoices.
	}
	@table.Header() {
		@table.Row() {
			@table.Head(table.HeadProps{Class: "w-[100px]"}) {
				Invoice
			}
			@table.Head() {
				Status
			}
			@table.Head() {
				Method
			}
			@table.Head(table.HeadProps{Class: "text-right"}) {
				Amount
			}
		}
	}
	@table.Body() {
		@table.Row() {
			@table.Cell(table.CellProps{Class: "font-medium"}) {
				INV001
			}
			@table.Cell() {
				Paid
			}
			@table.Cell() {
				Credit Card
			}
			@table.Cell(table.CellProps{Class: "text-right"}) {
				$250.00
			}
		}
	}
}
```

## Composition

Use the following composition to build a `Table`:

```text
table.Table
├── table.Caption
├── table.Header
│   └── table.Row
│       ├── table.Head
│       ├── table.Head
│       ├── table.Head
│       └── table.Head
├── table.Body
│   ├── table.Row
│   │   ├── table.Cell
│   │   ├── table.Cell
│   │   ├── table.Cell
│   │   └── table.Cell
│   └── table.Row
│       ├── table.Cell
│       ├── table.Cell
│       ├── table.Cell
│       └── table.Cell
└── table.Footer
```

## Footer

Use the `table.Footer` component to add a footer to the table.

<ComponentPreview name="table-footer" />

## Actions

A table showing actions for each row using a `DropdownMenu` component.

<ComponentPreview name="table-actions" />

## API Reference

### Table

The `table.Table` component renders a native table inside a scrollable container.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### TableHeader, TableBody, TableFooter

The `table.Header`, `table.Body` and `table.Footer` components render the table sections.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### TableRow, TableHead, TableCell, TableCaption

The `table.Row`, `table.Head`, `table.Cell` and `table.Caption` components render rows, header cells, data cells and the caption.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |
