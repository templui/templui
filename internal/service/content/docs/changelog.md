---
title: "Changelog"
description: "Latest updates and announcements."
---

Latest updates and announcements for templui.

## June 2026 - Hover Card

A new [Hover Card](/docs/components/hover-card) component is now available. It shows rich content on hover, built as a thin wrapper around Popover with hover defaults (150ms open / 300ms close).

Hover-based popovers (Tooltip, Hover Card) now also open on keyboard focus and close on blur for accessibility, and the default tooltip open/close delay is now instant to match shadcn.

Add it to your project with the CLI:

```shell
templui add hover-card
```

Released in [v1.12.0](https://github.com/templui/templui/releases/tag/v1.12.0).

## May 2026 - Calendar Range Selection

The [Calendar](/docs/components/calendar) component now supports range selection via a new `SelectionMode` (single/range) plus `EndValue` and `EndName` props. The [Date Picker](/docs/components/date-picker) forwards the new range props and renders the selected value as `start – end` in range mode.

The calendar selection event was renamed from `calendar-date-selected` to `calendar-selected` with a unified payload for both modes — update any direct listeners (breaking change).

Released in [v1.11.0](https://github.com/templui/templui/releases/tag/v1.11.0).

## April 2026 - Range Slider

The [Slider](/docs/components/slider) component gained a `Range` component for selecting a value range with two handles. The slider was rebuilt around a custom implementation, replacing the native `<input type="range">` — existing usages need to be updated to the new component API (breaking change).

[Dialog](/docs/components/dialog) gained optional modal mode via `DisableModal` on `dialog.Content`, allowing the native backdrop to be disabled for dialogs that contain nested overlays.

Released in [v1.10.0](https://github.com/templui/templui/releases/tag/v1.10.0).

## April 2026 - Native Dialog

Dialog-based overlays ([Dialog](/docs/components/dialog), [Sheet](/docs/components/sheet)) were rebuilt around the native `<dialog>` element, simplifying trigger targeting, click-away handling, ESC handling, and sheet positioning while removing the previous duplicated overlay-layer approach (breaking for `dialog.Content` / `sheet.Content` users who were setting `ID` or `Open` there).

Released in [v1.9.3](https://github.com/templui/templui/releases/tag/v1.9.3).

---

For the full release history, see the [CHANGELOG on GitHub](https://github.com/templui/templui/blob/main/CHANGELOG.md).
