---
title: "Getting Started"
description: "How the templui registry is served and how to run your own."
---

This guide documents how the templui registry works: the `registry.json` catalog, the endpoints the server exposes, and how to test a registry with the CLI. If you serve the same JSON shapes from your own server, the `templui` CLI can install from it.

<Callout>

**Note:** templui has no pendant of the `shadcn build` command or `include` composition. The registry is a single flat `registry.json`, served verbatim, and the item endpoints are built from it at request time.

</Callout>

## Requirements

You are free to serve your registry as you see fit. The only requirement is that your registry catalog and registry items must conform to the [registry schema specification](/docs/registry/registry-json) and [registry-item schema specification](/docs/registry/registry-item-json).

Your registry can be any server, as long as it supports serving JSON over HTTP.

## registry.json

The `registry.json` is the entry point for the registry. It contains the registry's name, homepage, and defines all the items present in the registry.

It is served verbatim at `/r/registry.json`. The CLI fetches it to resolve `--all` and to list component names.

Here's an excerpt of the templui `registry.json` file:

```json title="registry.json"
{
  "$schema": "https://templui.io/schema/registry.json",
  "name": "templui",
  "homepage": "https://templui.io",
  "items": [
    {
      "name": "accordion",
      "type": "registry:ui",
      "title": "Accordion",
      "description": "Collapsible accordion component.",
      "registryDependencies": ["icon"],
      "files": [
        {
          "path": "components/accordion/accordion.templ",
          "type": "registry:ui"
        },
        {
          "path": "components/accordion/accordion.js",
          "type": "registry:ui"
        }
      ],
      "categories": ["layout-navigation"]
    }
  ]
}
```

This `registry.json` file must conform to the [registry schema specification](/docs/registry/registry-json).

## Serve your registry

The registry is served from these endpoints:

| Endpoint                          | Description                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/r/registry.json`                | The source registry catalog, served verbatim.                                                                  |
| `/r/styles/{style}/index.json`    | The `registry:style` item of a style — base CSS imports, the Go module dependency and the `utils` dependency.  |
| `/r/styles/{style}/{name}.json`   | One item compiled for that style. `.templ` sources are inlined with the style's flat Tailwind classes, `.js` files ship verbatim. |
| `/init`                           | The `registry:base` item for a design system config (`?preset=<code>`, or individual params; `?only=theme\|font` for the partial item). |
| `/assets/css/{name}.css`          | The vendored stylesheets (`tw-animate.css`, `shadcn-tailwind.css`) that the base item's `css` block imports.   |

The `{style}` segment is templui's base prefixed onto a style name: `base-vega`, `base-nova`, `base-maia`, `base-lyra`, `base-mira`, `base-luma`, `base-sera`, `base-rhea`.

## Test your registry

After your registry is being served, test it with the same CLI commands that other developers will use.

### Using `--registry`

Point the CLI at the registry base URL. The `TEMPLUI_REGISTRY` environment variable works the same way, below the flag.

#### Initialize a project

```shell
templui init --preset nova --registry http://localhost:8090
```

#### Add an item

To test the install flow, run `add` from a project where you want to install the item.

```shell
templui add button --registry http://localhost:8090
```

#### Apply a preset

```shell
templui apply nova --registry http://localhost:8090
```

### Using URL

Item URLs work directly, bypassing the configured style resolution.

```shell
templui add http://localhost:8090/r/styles/base-nova/button.json
```

## Guidelines

Here are some guidelines to follow when adding items to a registry.

- The item `name` is kebab-case and must be unique for your registry. In the templui registry it doubles as the docs slug.
- It is recommended to add a proper `title` and `description` to your registry item. This helps LLMs understand the component and its purpose.
- Make sure to list all registry dependencies in `registryDependencies`. A registry dependency is an item name such as `button`, or the URL of a registry item.
- For every file, specify the `path` and `type` of the file. The install path is derived from `path` and the consumer's `components.json` aliases.
