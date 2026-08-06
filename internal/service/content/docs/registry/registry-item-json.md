---
title: "registry-item.json"
description: "Specification for registry items."
---

The `registry-item.json` schema is used to define registry items. It is the shape served at `/r/styles/{style}/{name}.json` and by `/init`.

```json title="registry-item.json"
{
  "$schema": "https://templui.io/schema/registry-item.json",
  "name": "accordion",
  "registryDependencies": ["icon"],
  "files": [
    {
      "path": "components/accordion/accordion.templ",
      "content": "...",
      "type": "registry:ui"
    },
    {
      "path": "components/accordion/accordion.js",
      "content": "...",
      "type": "registry:ui"
    }
  ],
  "type": "registry:ui",
  "meta": {
    "links": {
      "docs": "https://templui.io/docs/components/accordion"
    }
  }
}
```

## Definitions

### $schema

The `$schema` property identifies the templui `registry-item.json` format.

```json title="registry-item.json"
{
  "$schema": "https://templui.io/schema/registry-item.json"
}
```

### name

The name of the item. This is used to identify the item in the registry. It should be unique for your registry. In the templui registry it is the kebab-case component name and doubles as the docs slug.

```json title="registry-item.json"
{
  "name": "alert-dialog"
}
```

### title

A human-readable title for your registry item. Keep it short and descriptive.

```json title="registry-item.json"
{
  "title": "Alert Dialog"
}
```

### description

A description of your registry item. This can be longer and more detailed than the `title`.

```json title="registry-item.json"
{
  "description": "Modal dialog for critical confirmations."
}
```

### type

The `type` property is used to specify the type of your registry item. This is used to determine how the item is resolved and installed.

```json title="registry-item.json"
{
  "type": "registry:ui"
}
```

The following types are used:

| Type             | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `registry:ui`    | Use for UI components. Installed under the `components` alias.                    |
| `registry:lib`   | Use for lib and utils, e.g. the shared `utils` package.                           |
| `registry:style` | The style index item at `/r/styles/{style}/index.json`, resolved first by the CLI. |
| `registry:theme` | Use for themes: CSS variables without files.                                      |
| `registry:base`  | The design system item served by `/init`.                                         |

### dependencies

The `dependencies` property is used to specify the dependencies of your registry item. This is for Go modules.

Use `@version` to specify the version, e.g. `@latest`.

```json title="registry-item.json"
{
  "dependencies": ["github.com/axadrn/shadcn-templ/v2@latest"]
}
```

### registryDependencies

Used for registry dependencies. Each entry is an item address, resolved recursively by the CLI.

- For templui registry items such as `button`, `icon`, `utils`, etc use the name eg. `["button", "icon"]`.
- For custom registry items use the URL of the registry item eg. `["https://example.com/r/styles/base-nova/button.json"]`.

```json title="registry-item.json"
{
  "registryDependencies": ["button", "icon"]
}
```

### files

The `files` property is used to specify the files of your registry item. Each file has a `path`, `type` and, in served items, a `content` property.

```json title="registry-item.json"
{
  "files": [
    {
      "path": "components/accordion/accordion.templ",
      "content": "...",
      "type": "registry:ui"
    },
    {
      "path": "components/accordion/accordion.js",
      "content": "...",
      "type": "registry:ui"
    }
  ]
}
```

#### path

The `path` property is used to specify the path to the file in the registry. The CLI derives the install path from `path` and the consumer's `components.json` aliases — there is no `target` property.

#### content

The `content` property carries the file source in served items. `.templ` sources are compiled for the requested style with flat Tailwind classes; `.js` files ship verbatim. The source `registry.json` catalog omits `content`.

#### type

The `type` property is used to specify the type of the file. See the [type](#type) section for more information.

### cssVars

Use to define CSS variables for your registry item. `registry:theme` and `registry:base` items carry the theme here.

```json title="registry-item.json"
{
  "cssVars": {
    "theme": {
      "--font-heading": "var(--font-sans)"
    },
    "light": {
      "background": "oklch(1 0 0)",
      "radius": "0.625rem"
    },
    "dark": {
      "background": "oklch(0.145 0 0)"
    }
  }
}
```

### css

Use `css` to add rules to the consumer's CSS file. The base item uses it for the vendored stylesheet imports and the `@layer base` rules.

```json title="registry-item.json"
{
  "css": {
    "@import \"./tw-animate.css\"": {},
    "@import \"./shadcn-tailwind.css\"": {},
    "@layer base": {
      "*": {
        "@apply border-border outline-ring/50": {}
      },
      "body": {
        "@apply bg-background text-foreground": {}
      }
    }
  }
}
```

The `@import` entries reference the vendored stylesheets, which the CLI fetches from the registry's `/assets/css/` and writes next to the consumer's Tailwind entry file.

### extends

The `extends` property marks a `registry:base` item that does not extend another base. The `/init` item sets it to `"none"`.

```json title="registry-item.json"
{
  "extends": "none"
}
```

### config

The `config` property of a `registry:base` item carries the design system config the CLI writes into `components.json`: `style`, `tailwind.baseColor`, `iconLibrary`, `rtl`, `menuColor` and `menuAccent`.

```json title="registry-item.json"
{
  "config": {
    "style": "base-nova",
    "tailwind": {
      "baseColor": "neutral"
    },
    "iconLibrary": "lucide",
    "rtl": false,
    "menuColor": "default",
    "menuAccent": "subtle"
  }
}
```

### categories

Use `categories` to organize your registry item. The templui catalog uses them to group components.

```json title="registry-item.json"
{
  "categories": ["layout-navigation"]
}
```

### meta

Use `meta` to add additional metadata to your registry item. Served `registry:ui` items carry the docs link here.

```json title="registry-item.json"
{
  "meta": {
    "links": {
      "docs": "https://templui.io/docs/components/accordion"
    }
  }
}
```
