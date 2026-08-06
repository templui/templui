---
title: Card
description: Displays a card with header, content, and footer.
---

<ComponentPreview name="card-demo" previewClassName="h-[30rem]" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
templui add card
```

</TabsContent>

<TabsContent value="manual">

<Steps className="mb-0 pt-2">

<Step>Copy and paste the following code into your project.</Step>

<ComponentSource name="card" title="components/card/card.templ" />

<Step>Update the import paths to match your project setup.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```go showLineNumbers
import "github.com/axadrn/shadcn-templ/v2/components/card"
```

```templ showLineNumbers
@card.Card() {
	@card.Header() {
		@card.Title() {
			Card Title
		}
		@card.Description() {
			Card Description
		}
		@card.Action() {
			Card Action
		}
	}
	@card.Content() {
		<p>Card Content</p>
	}
	@card.Footer() {
		<p>Card Footer</p>
	}
}
```

## Composition

Use the following composition to build a `Card`:

```text
card.Card
├── card.Header
│   ├── card.Title
│   ├── card.Description
│   └── card.Action
├── card.Content
└── card.Footer
```

## Size

Use the `Size: card.SizeSm` prop to set the size of the card to small. The small size variant uses smaller spacing.

<ComponentPreview name="card-small" previewClassName="h-96" />

## Spacing

In addition to the `Size` prop, you can use the `--card-spacing` CSS variable to control the spacing between sections and the inset of card parts.

<ComponentPreview name="card-spacing" previewClassName="h-[34rem]" />

Use negative margins with `-mx-(--card-spacing)` to make content go edge to edge while keeping it aligned with the card inset. When the edge-to-edge content sits above a footer, use `-mb-(--card-spacing)` on `card.Content` to remove the section gap.

<ComponentPreview name="card-edge-to-edge" previewClassName="h-[24rem]" />

## Image

Add an image before the card header to create a card with an image.

<ComponentPreview name="card-image" previewClassName="h-[32rem]" />

## API Reference

### Card

The `Card` component is the root container for card content.

| Prop    | Type                    | Default       |
| ------- | ----------------------- | ------------- |
| `Size`  | `SizeDefault \| SizeSm` | `SizeDefault` |
| `Class` | `string`                | -             |

### Header

The `card.Header` component is used for a title, description, and optional action.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Title

The `card.Title` component is used for the card title.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Description

The `card.Description` component is used for helper text under the title.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Action

The `card.Action` component places content in the top-right of the header (for example, a button or a badge).

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Content

The `card.Content` component is used for the main card body.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### Footer

The `card.Footer` component is used for actions and secondary content at the bottom of the card.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |
