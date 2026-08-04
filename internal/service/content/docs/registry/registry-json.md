---
title: "registry.json"
description: "Schema for the templui component registry."
---

The `registry.json` schema is used to define the component registry. It is the source catalog the registry server serves verbatim at `/r/registry.json`.

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

<Callout>

**Note:** templui has no pendant of shadcn's `include` composition. The registry is a single flat `registry.json` — every item is defined in the root file.

</Callout>

## Definitions

### $schema

The `$schema` property identifies the templui `registry.json` format.

```json title="registry.json"
{
  "$schema": "https://templui.io/schema/registry.json"
}
```

### name

The `name` property is used to specify the name of your registry. This is used for metadata.

```json title="registry.json"
{
  "name": "templui"
}
```

### homepage

The homepage of your registry. This is used for metadata.

```json title="registry.json"
{
  "homepage": "https://templui.io"
}
```

### items

The `items` in your registry. Each item must implement the [registry-item schema specification](/docs/registry/registry-item-json).

```json title="registry.json"
{
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
        }
      ]
    }
  ]
}
```

Registry item names must be unique across the registry.

See the [registry-item schema documentation](/docs/registry/registry-item-json) for more information.
