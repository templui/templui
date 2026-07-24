---
title: Skeleton
description: Use to show a placeholder while content is loading.
---

<ComponentPreview name="skeleton-demo" />

## Installation

<Installation name="skeleton" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/skeleton"
```

```templ showLineNumbers
@skeleton.Skeleton(skeleton.Props{Class: "h-[20px] w-[100px] rounded-full"})
```

## Avatar

<ComponentPreview name="skeleton-avatar" />

## Card

<ComponentPreview name="skeleton-card" previewClassName="h-80" />

## Text

<ComponentPreview name="skeleton-text" />

## Form

<ComponentPreview name="skeleton-form" />

## Table

<ComponentPreview name="skeleton-table" />

## API Reference

### Skeleton

The `Skeleton` component renders an animated placeholder block.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |
