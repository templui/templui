---
title: "April 2026 - Native Dialog"
description: "Dialog and Sheet rebuilt around the native dialog element."
date: 2026-04-01
---

Dialog-based overlays ([Dialog](/docs/components/dialog), [Sheet](/docs/components/sheet)) were rebuilt around the native `<dialog>` element, simplifying trigger targeting, click-away handling, ESC handling, and sheet positioning while removing the previous duplicated overlay-layer approach (breaking for `dialog.Content` / `sheet.Content` users who were setting `ID` or `Open` there).

Released in [v1.9.3](https://github.com/templui/templui/releases/tag/v1.9.3).
