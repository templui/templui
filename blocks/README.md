# Block reference

The source of truth for these ports is shadcn/ui's current
[`apps/v4/registry/bases/base/blocks`](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/bases/base/blocks)
registry. The last full comparison used upstream commit
`d4fc45b1fbabfccb7a6a4333d8004cf19481caa9` (2026-08-13).

The public shadcn blocks gallery can still render `new-york-v4` blocks backed
by Radix UI. Those previews can therefore differ from the current Base UI
registry in details such as popup width, avatar radius, icons, and state data
attributes.

When syncing a block:

- Preserve the Base UI block's content, assets, responsive behavior, and
  block-level utility overrides.
- Translate React and Base UI primitive behavior to the templ/vanilla Base UI
  pendant without copying Radix-specific variables or selectors.
- Keep necessary stack translations local and explicit. Do not change a shared
  component merely to reproduce a legacy block preview.
