---
title: "components.json"
description: "Configuration for your project."
order: 3
---

The `components.json` file holds configuration for your project.

We use it to understand how your project is set up and how to generate components customized for your project.

<Callout className="mt-6">

**Note: The `components.json` file is optional.** It is **only required if you're using the CLI** to add components to your project. If you're using the [import workflow](/docs/installation), you don't need this file.

</Callout>

You can create a `components.json` file in your project by running the following command:

```shell
templui init
```

See the [CLI section](/docs/cli) for more information.

## $schema

The `$schema` identifies the templui `components.json` format. `templui init` writes it for you.

```json title="components.json"
{
  "$schema": "https://templui.io/schema/components.json"
}
```

## style

The style for your components. `init` writes it from your preset (`base-nova`, `base-vega`, ...), and `templui add` fetches every component pre-compiled for this style.

```json title="components.json"
{
  "style": "base-nova"
}
```

To change the style of an existing project, apply a new preset with `templui apply`.

## tailwind

Configuration to help the CLI understand how Tailwind CSS is set up in your project.

See the [installation section](/docs/installation) for how to set up Tailwind CSS.

### tailwind.css

Path to the CSS file that imports Tailwind CSS into your project, relative to your project root. `init` detects it, or creates `assets/css/globals.css`; override with `--css`.

```json title="components.json"
{
  "tailwind": {
    "css": "assets/css/globals.css"
  }
}
```

### tailwind.baseColor

This is used to generate the default theme tokens for your components.

```json title="components.json"
{
  "tailwind": {
    "baseColor": "neutral" | "stone" | "zinc" | "mauve" | "olive" | "mist" | "taupe"
  }
}
```

### tailwind.cssVariables

We use CSS variables for theming. templui components always theme through CSS variables, so `init` writes `true`.

```json title="components.json"
{
  "tailwind": {
    "cssVariables": true
  }
}
```

For more information, see the [theming docs](/docs/theming).

## iconLibrary

The icon library of your preset. templui currently ships `lucide`.

```json title="components.json"
{
  "iconLibrary": "lucide"
}
```

## rtl

Whether your components install with RTL (right-to-left) support. Written from your preset; `templui apply` requests RTL-compiled components from the registry when it is `true`.

```json title="components.json"
{
  "rtl": false
}
```

## menuColor

The menu appearance of your preset: `default`, `default-translucent`, `inverted` or `inverted-translucent`. Written from your preset and used by `templui preset resolve` to reconstruct your preset code.

```json title="components.json"
{
  "menuColor": "default"
}
```

## menuAccent

The menu accent of your preset: `subtle` or `bold`. Written from your preset and used by `templui preset resolve` to reconstruct your preset code.

```json title="components.json"
{
  "menuAccent": "subtle"
}
```

## aliases

The CLI uses these values to place generated components in the correct location and rewrite imports.

The aliases are Go import paths. `init` derives them from the `module` path in your `go.mod`, and both must live under that module path.

### aliases.utils

Import path for the shared `utils` package.

```json title="components.json"
{
  "aliases": {
    "utils": "your-app/utils"
  }
}
```

### aliases.components

Import path for your components.

```json title="components.json"
{
  "aliases": {
    "components": "your-app/components"
  }
}
```
