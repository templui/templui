---
title: "May 2026 - Calendar Range Selection"
description: "Range selection for the Calendar and Date Picker components."
date: 2026-05-01
---

The [Calendar](/docs/components/calendar) component now supports range selection via a new `SelectionMode` (single/range) plus `EndValue` and `EndName` props. The [Date Picker](/docs/components/date-picker) forwards the new range props and renders the selected value as `start – end` in range mode.

The calendar selection event was renamed from `calendar-date-selected` to `calendar-selected` with a unified payload for both modes — update any direct listeners (breaking change).

Released in [v1.11.0](https://github.com/axadrn/shadcn-templ/releases/tag/v1.11.0).
