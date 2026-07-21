---
title: Dropdown Menu
description: Displays a menu to the user, such as a set of actions or functions, triggered by a button.
---

<ComponentPreview name="dropdown-menu-demo" />

## Installation

<Installation name="dropdownmenu" />

## Usage

```go showLineNumbers
import "github.com/templui/templui/components/dropdownmenu"
```

```templ showLineNumbers
@dropdownmenu.Root() {
	@button.Button(button.Props{
		Variant:    button.VariantOutline,
		Attributes: dropdownmenu.Trigger(ctx),
	}) {
		Open
	}
	@dropdownmenu.Content() {
		@dropdownmenu.Group() {
			@dropdownmenu.Label() {
				My Account
			}
			@dropdownmenu.Item() {
				Profile
			}
			@dropdownmenu.Item() {
				Billing
			}
		}
		@dropdownmenu.Separator()
		@dropdownmenu.Group() {
			@dropdownmenu.Item() {
				Team
			}
			@dropdownmenu.Item() {
				Subscription
			}
		}
	}
}
```

## Composition

Use the following composition to build a `DropdownMenu`:

```text
dropdownmenu.Root
├── dropdownmenu.Trigger
└── dropdownmenu.Content
    ├── dropdownmenu.Group
    │   ├── dropdownmenu.Label
    │   ├── dropdownmenu.Item
    │   └── dropdownmenu.Item
    ├── dropdownmenu.Separator
    ├── dropdownmenu.Group
    │   ├── dropdownmenu.Label
    │   ├── dropdownmenu.CheckboxItem
    │   └── dropdownmenu.CheckboxItem
    ├── dropdownmenu.Separator
    ├── dropdownmenu.Group
    │   ├── dropdownmenu.Label
    │   └── dropdownmenu.RadioGroup
    │       ├── dropdownmenu.RadioItem
    │       └── dropdownmenu.RadioItem
    └── dropdownmenu.Sub
        ├── dropdownmenu.SubTrigger
        └── dropdownmenu.SubContent
            └── dropdownmenu.Group
                ├── dropdownmenu.Label
                ├── dropdownmenu.Item
                └── dropdownmenu.Item
```

## Basic

A basic dropdown menu with labels and separators.

<ComponentPreview name="dropdown-menu-basic" />

## Submenu

Use `dropdownmenu.Sub` to nest secondary actions.

<ComponentPreview name="dropdown-menu-submenu" />

## Shortcuts

Add `dropdownmenu.Shortcut` to show keyboard hints.

<ComponentPreview name="dropdown-menu-shortcuts" />

## Icons

Combine icons with labels for quick scanning.

<ComponentPreview name="dropdown-menu-icons" />

## Checkboxes

Use `dropdownmenu.CheckboxItem` for toggles.

<ComponentPreview name="dropdown-menu-checkboxes" />

## Checkboxes Icons

Add icons to checkbox items.

<ComponentPreview name="dropdown-menu-checkboxes-icons" />

## Radio Group

Use `dropdownmenu.RadioGroup` for exclusive choices.

<ComponentPreview name="dropdown-menu-radio-group" />

## Radio Icons

Show radio options with icons.

<ComponentPreview name="dropdown-menu-radio-icons" />

## Destructive

Use `Variant: dropdownmenu.ItemVariantDestructive` for irreversible actions.

<ComponentPreview name="dropdown-menu-destructive" />

## Avatar

An account switcher dropdown triggered by an avatar.

<ComponentPreview name="dropdown-menu-avatar" />

## Complex

A richer example combining groups, icons, and submenus.

<ComponentPreview name="dropdown-menu-complex" />

## API Reference

### Content

The `dropdownmenu.Content` component is the menu surface, anchored to the trigger.

| Prop          | Type                                                    | Default      |
| ------------- | ------------------------------------------------------- | ------------ |
| `Side`        | `SideTop \| SideRight \| SideBottom \| SideLeft`   | `SideBottom` |
| `Align`       | `AlignStart \| AlignCenter \| AlignEnd`             | `AlignStart` |
| `SideOffset`  | `int`                                                   | `4`          |
| `AlignOffset` | `int`                                                   | `0`          |
| `Class`       | `string`                                                | -            |

### Item

The `dropdownmenu.Item` component is a selectable entry. It renders as a link when `Href` is set and closes the menu on click.

| Prop           | Type                                              | Default              |
| -------------- | ------------------------------------------------- | -------------------- |
| `Variant`      | `ItemVariantDefault \| ItemVariantDestructive` | `ItemVariantDefault` |
| `Inset`        | `bool`                                            | `false`              |
| `Disabled`     | `bool`                                            | `false`              |
| `Href`         | `string`                                          | -                    |
| `Target`       | `string`                                          | -                    |
| `PreventClose` | `bool`                                            | `false`              |
| `Class`        | `string`                                          | -                    |

### CheckboxItem

The `dropdownmenu.CheckboxItem` component is a toggleable item with a check indicator. It keeps the menu open on click.

| Prop       | Type     | Default |
| ---------- | -------- | ------- |
| `Checked`  | `bool`   | `false` |
| `Disabled` | `bool`   | `false` |
| `Class`    | `string` | -       |

### RadioGroup

The `dropdownmenu.RadioGroup` component wraps radio items and enforces single selection among them.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Class` | `string` | -       |

### RadioItem

The `dropdownmenu.RadioItem` component is a single-select item with a dot indicator. It keeps the menu open on click.

| Prop       | Type     | Default |
| ---------- | -------- | ------- |
| `Value`    | `string` | -       |
| `Checked`  | `bool`   | `false` |
| `Disabled` | `bool`   | `false` |
| `Class`    | `string` | -       |

### SubTrigger

The `dropdownmenu.SubTrigger` component opens a nested submenu on hover. Wrap it with `dropdownmenu.SubContent` in a `dropdownmenu.Sub`.

| Prop    | Type     | Default |
| ------- | -------- | ------- |
| `Inset` | `bool`   | `false` |
| `Class` | `string` | -       |
