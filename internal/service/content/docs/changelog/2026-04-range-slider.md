---
title: "April 2026 - Range Slider"
description: "A two-handle Range component for the Slider, and optional modal mode for the Dialog."
date: 2026-04-15
---

The [Slider](/docs/components/slider) component gained a `Range` component for selecting a value range with two handles. The slider was rebuilt around a custom implementation, replacing the native `<input type="range">` — existing usages need to be updated to the new component API (breaking change).

[Dialog](/docs/components/dialog) gained optional modal mode via `DisableModal` on `dialog.Content`, allowing the native backdrop to be disabled for dialogs that contain nested overlays.

Released in [v1.10.0](https://github.com/axadrn/shadcn-templ/releases/tag/v1.10.0).
