---
title: Icon
description: A wrapper for Lucide Icons that is primarily styled with Tailwind utility classes.
---

<ComponentPreview name="icon-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
templui add icon
```

</TabsContent>

<TabsContent value="manual">

<Steps className="mb-0 pt-2">

<Step>Copy and paste the following code into your project.</Step>

<ComponentSource name="icon" title="components/icon/icon_data.go" />

<ComponentSource name="icon" title="components/icon/icon_defs.go" />

<ComponentSource name="icon" title="components/icon/icon.go" />

<Step>Update the import paths to match your project setup.</Step>

</Steps>

</TabsContent>

</CodeTabs>

## Usage

```go
import "github.com/templui/templui/components/icon"
```

```templ
@icon.User(icon.Props{Class: "size-6"})
```

Browse the [Lucide library](https://lucide.dev/icons) to see every available icon, each one exists as a Go function with the PascalCase name of the icon.

## Colored

Use text color utilities to color an icon.

<ComponentPreview name="icon-colored" />

## Filled

Use `fill-current` to fill an icon with the current text color.

<ComponentPreview name="icon-filled" />

## Sizes

Use size utilities to scale an icon.

<ComponentPreview name="icon-sizes" />

## API Reference

### Icon

Every Lucide icon is a templ component, `icon.User`, `icon.ChevronDown`, and so on.

| Prop         | Type               | Default |
| ------------ | ------------------ | ------- |
| `Class`      | `string`           | -       |
| `Attributes` | `templ.Attributes` | -       |
