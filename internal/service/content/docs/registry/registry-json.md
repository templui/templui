---
title: "registry.json"
description: "Schema for the shadcn-templ component registry."
---

The `registry.json` schema is used to define the component registry. It is the source catalog the registry server serves verbatim at `/r/registry.json`.

```json title="registry.json"
{
  "$schema": "https://shadcn-templ.com/schema/registry.json",
  "name": "shadcn-templ",
  "homepage": "https://shadcn-templ.com",
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

**Note:** shadcn-templ has no pendant of shadcn's `include` composition. The registry is a single flat `registry.json` — every item is defined in the root file.

</Callout>

## Definitions

### $schema

The `$schema` property identifies the shadcn-templ `registry.json` format.

```json title="registry.json"
{
  "$schema": "https://shadcn-templ.com/schema/registry.json"
}
```

### name

The `name` property is used to specify the name of your registry. This is used for metadata.

```json title="registry.json"
{
  "name": "shadcn-templ"
}
```

### homepage

The homepage of your registry. This is used for metadata.

```json title="registry.json"
{
  "homepage": "https://shadcn-templ.com"
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
