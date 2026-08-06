---
title: "Package Imports"
description: "Configure templui with Go import paths."
---

The `templui` CLI uses Go import paths for installing components and rewriting imports.

Go resolves imports through the `module` path in your `go.mod`, so there is no separate alias configuration like path mappings in other ecosystems. The CLI derives your import paths from `go.mod` and stores them as `aliases` in `components.json`.

## Example

You configure `aliases` in your `components.json`:

```json title="components.json"
{
  "aliases": {
    "components": "your-app/components",
    "utils": "your-app/utils"
  }
}
```

Then import installed components using your module path:

```go
import (
  "your-app/components/button"
  "your-app/utils"
)
```

<Callout className="mt-6">

Alias paths are Go import paths and must live under the `module` path of your `go.mod`. `templui init` derives them for you.

</Callout>

## Module Imports

In the import workflow, components are imported directly from the templui module. No `components.json` and no aliases are needed:

```go
import "github.com/axadrn/shadcn-templ/v2/components/button"
```

See the [installation guide](/docs/installation) for the full setup of both workflows.

## App

For apps that install components into their own module with the CLI.

<Steps>

### Configure `go.mod`

The `module` path is the root of every generated import.

```text title="go.mod"
module your-app
```

### Configure `components.json`

Run `templui init` to write `components.json`. It derives the aliases from your `go.mod` module path.

```json title="components.json"
{
  "aliases": {
    "components": "your-app/components",
    "utils": "your-app/utils"
  }
}
```

The `components` alias is the import path components install under. The `utils` alias is the import path of the shared `utils` package.

### Add components

```shell
templui add button
```

The CLI resolves registry dependencies recursively and rewrites all imports — `github.com/axadrn/shadcn-templ/v2/components/...` and `github.com/axadrn/shadcn-templ/v2/utils` — to your aliases.

</Steps>

## Troubleshooting

If Go cannot resolve an import after adding components, check that:

- the alias paths in `components.json` live under the `module` path of your `go.mod`
- you ran `templ generate` and `go mod tidy` after adding
- the component directory exists under the path the `components` alias points to

If a component is installed but its imports still point at the wrong module path, fix the `aliases` in `components.json` and re-run `templui add <component> --overwrite`.
