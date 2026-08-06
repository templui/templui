---
title: "Introduction"
description: "How shadcn-templ distributes code through a registry."
---

shadcn-templ distributes its code through a registry. The registry allows the `shadcn-templ` CLI to install components, the shared `utils` package, themes and presets into any project — everything `init`, `add` and `apply` install comes from it over HTTP.

<Callout>

**Note:** The registry is a set of plain JSON endpoints. Any server that serves the same JSON shapes works as a registry — the CLI can be pointed at it with `--registry` or the `SHADCN_TEMPL_REGISTRY` environment variable.

</Callout>

The official registry is served at `https://shadcn-templ.com`. The next sections document how it is served, the schema of the registry catalog, and the specification of registry items.

- [Getting Started](/docs/registry/getting-started) — How the registry is served and how to run your own
- [registry.json](/docs/registry/registry-json) — Schema specification for the registry catalog
- [registry-item.json](/docs/registry/registry-item-json) — Specification for registry items
