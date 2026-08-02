---
title: "Installation"
description: "How to install dependencies and structure your app."
order: 2
---

## Overview

templUI supports two workflows:

- `Import Workflow` for direct Go imports from `github.com/templui/templui`
- `CLI Workflow` for copying components into your own codebase

Use the import workflow when you want the simplest setup. Use the CLI workflow when you want to own the component source in your app. `templui-quickstart` uses the import workflow.

## Quickstart

Start fast with [`templui/templui-quickstart`](https://github.com/templui/templui-quickstart):

```shell
git clone https://github.com/templui/templui-quickstart.git myapp
rm -rf myapp/.git
cd myapp
cp .env.example .env
go mod tidy
task dev
```

## Prerequisites

The documented setup uses these tools in every workflow.

### Go

```shell
go version  # Check if installed
```

> **📝 Note:** Download from [golang.org/dl](https://golang.org/dl) if not installed.

### templ

```shell
go install github.com/a-h/templ/cmd/templ@latest
```

> **📝 Note:** Learn more at [templ.guide](https://templ.guide)

### Tailwind CSS v4.1+

The Tailwind CSS standalone CLI is required:
- Download from [GitHub Releases](https://github.com/tailwindlabs/tailwindcss/releases/latest)
- Or use your package manager

### Task

```shell
go install github.com/go-task/task/v3/cmd/task@latest
```

> **📝 Note:** Learn more at [taskfile.dev](https://taskfile.dev)

## Import Workflow

Use this when you want the simplest setup and prefer importing component packages directly.

### 1. Add templUI

```shell
go get github.com/templui/templui@latest
```

You can also just import a component package and run `go mod tidy`.

### 2. Base Styles

Create `assets/css/input.css`:

This is your Tailwind entry file. Tailwind reads it and writes the compiled result to `assets/css/output.css`.

```css
@import "tailwindcss";
@import "./sources.generated.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --breakpoint-3xl: 1600px;
  --breakpoint-4xl: 2000px;
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0% 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0% 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0% 0 0);
  --primary: oklch(0% 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.97 0.01 17);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: var(--color-blue-300);
  --chart-2: var(--color-blue-500);
  --chart-3: var(--color-blue-600);
  --chart-4: var(--color-blue-700);
  --chart-5: var(--color-blue-800);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0% 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.371 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.58 0.22 27);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: var(--color-blue-300);
  --chart-2: var(--color-blue-500);
  --chart-3: var(--color-blue-600);
  --chart-4: var(--color-blue-700);
  --chart-5: var(--color-blue-800);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.439 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

> **💡 Tip:** For custom themes and color palettes, see the [theming docs](/docs/theming).

### 3. Create Taskfile

```yaml
version: "3"

tasks:
  templ:
    desc: Run templ with integrated server and hot reload
    cmds:
      - templ generate --watch --proxy="http://localhost:8090" --cmd="go run ./main.go" --open-browser=false

  tailwind:
    desc: Watch Tailwind CSS changes
    cmds:
      - |
        TEMPLUI_PATH="$(go list -mod=mod -m -f {{`'{{.Dir}}'`}} github.com/templui/templui)" && \
        printf '%s\n' \
          '@source "./**/*.templ";' \
          "@source \"$TEMPLUI_PATH/components/**/*.templ\";" \
          > ./assets/css/sources.generated.css && \
        tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch

  dev:
    desc: Start development server with hot reload
    cmds:
      - task --parallel tailwind templ
```

Run everything with:

```shell
task dev
```

### 4. Import and use a component

```go
import "github.com/templui/templui/components/button"
```

```templ
@button.Button() {
  Click me
}
```

## CLI Workflow

Use this when you want templUI to copy component source into your own project for you. The CLI is the templ pendant of the shadcn CLI: `init`, `add`, `apply` and `preset`.

### 1. Install CLI

```shell
go install github.com/templui/templui/cmd/templui@latest
templui --version
```

### 2. Initialize Project

Run init inside your Go module (a `go.mod` is required):

```shell
templui init
```

Pick a design on [templui.io/create](https://templui.io/create) and pass its preset code, or use one of the named presets (`nova`, `vega`, `maia`, `lyra`, `mira`, `luma`, `sera`, `rhea`):

```shell
templui init --preset b2D0wqNxT
templui init --preset vega
```

Init fetches your preset from the registry and:

- writes `components.json` with your style, base color and aliases derived from your `go.mod` module path
- writes the theme CSS variables and base layer into your Tailwind entry file (detected, or created at `assets/css/input.css`; override with `--css`)
- vendors `tw-animate.css` and `shadcn-tailwind.css` next to your Tailwind entry file
- installs the shared `utils` package

```json
{
  "$schema": "https://templui.io/schema/components.json",
  "style": "base-nova",
  "tailwind": {
    "css": "assets/css/input.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "rtl": false,
  "iconLibrary": "lucide",
  "menuColor": "default",
  "menuAccent": "subtle",
  "aliases": {
    "components": "your-app/module/components",
    "utils": "your-app/module/utils"
  }
}
```

Flags: `--preset <code|url|name>`, `--base-color <color>`, `--css <path>`, `--force`, `--silent`, `--registry <url>`.

> **💡 Tip:** For custom themes and color palettes, see the [theming docs](/docs/theming).

### 3. Create Taskfile

Create `Taskfile.yml` in your project root:

```yaml
version: "3"

tasks:
  templ:
    desc: Run templ with integrated server and hot reload
    cmds:
      - templ generate --watch --proxy="http://localhost:8090" --cmd="go run ./main.go" --open-browser=false

  tailwind:
    desc: Watch Tailwind CSS changes
    cmds:
      - "tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --watch"

  dev:
    desc: Start development server with hot reload
    cmds:
      - task --parallel tailwind templ
```

Run everything with:

```shell
task dev
```

Adjust the `--proxy` port (default: 8090) if your app uses a different port. templ's dev server runs at http://localhost:7331

### 4. Add Components

Install components and their dependencies. The CLI resolves registry dependencies recursively (for example `alert-dialog` pulls in `button` and `dialog`) and rewrites all imports to your module:

```shell
# Specific components
templui add button card

# All components
templui add --all
```

The component source arrives pre-compiled for your configured style with flat Tailwind classes. After adding, run:

```shell
templ generate
go mod tidy
```

### 5. Use a component

```go
import "your-app/module/components/button"
```

```templ
@button.Button() {
  Click me
}
```

### 6. Update Components

Existing files are never overwritten silently. Re-run add with `--overwrite` to update:

```shell
templui add button --overwrite
```

Updates overwrite custom modifications, so back up your changes first.

### 7. Apply a Preset

Change the design of an existing project. Without `--only` this rewrites your config, CSS variables and re-installs every installed component in the new style; with `--only` just the selected parts:

```shell
templui apply b2D0wqNxT              # full preset
templui apply b2D0wqNxT --only theme # CSS variables only
templui apply b2D0wqNxT --only font  # font setup only
```

### 8. Preset Tools

```shell
templui preset decode b2D0wqNxT   # print the design a code encodes
templui preset resolve            # reconstruct the preset of this project
templui preset url b2D0wqNxT      # print the templui.io/create URL
```

### 9. Upgrade

The CLI updates itself the Go way:

```shell
go install github.com/templui/templui/cmd/templui@latest
```

## JavaScript

templUI ships all component behavior as one script bundle. The setup is a one-time step in your app, no per-component script tags.

Render the script tag once in your layout `<head>`:

```go
import "github.com/templui/templui/components"
```

```templ
<head>
  @components.Scripts()
</head>
```

Mount the route the script tag points at:

```go
mux.Handle("GET /components/templui.js", components.ScriptsHandler())
```

The bundle is the concatenation of every `components/*/*.js` file. In production (`GO_ENV=production`) it is built once from the embedded files and served with immutable caching; in development it is rebuilt from the local `components` directory on every request, so edits to copied component scripts hot-reload.

## Serve Assets

Use `setupAssetsRoutes(...)` to serve your app assets like Tailwind CSS output, fonts, images, and local files:

```go
func setupAssetsRoutes(mux *http.ServeMux) {
  isDevelopment := os.Getenv("GO_ENV") != "production"

  // Your app assets (CSS, fonts, images, ...)
  assetHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    if isDevelopment {
      w.Header().Set("Cache-Control", "no-store")
    } else {
      w.Header().Set("Cache-Control", "public, max-age=31536000")
    }

    var fs http.Handler
    if isDevelopment {
      fs = http.FileServer(http.Dir("./assets"))
    } else {
      fs = http.FileServer(http.FS(assets.Assets))
    }

    fs.ServeHTTP(w, r)
  })

  mux.Handle("GET /assets/", http.StripPrefix("/assets/", assetHandler))

  // templUI component script bundle
  mux.Handle("GET /components/templui.js", components.ScriptsHandler())
}
```

Your Go app must serve `/assets/...` so the browser can load `assets/css/output.css`, fonts, images, and local files. The `/components/templui.js` route serves the script bundle that `@components.Scripts()` loads.

For a complete import-based app setup, see [`templui/templui-quickstart`](https://github.com/templui/templui-quickstart).

## Component Props

Every component accepts three universal props that are left out of the per-component API tables:

| Prop         | Type               | Description                                          |
| ------------ | ------------------ | ---------------------------------------------------- |
| `ID`         | `string`           | HTML id for the rendered element.                    |
| `Class`      | `string`           | Additional CSS classes, merged with the defaults.    |
| `Attributes` | `templ.Attributes` | Additional HTML attributes spread onto the element.  |

Standard HTML behavior (`Disabled`, `Type`, `Href`, ...) works the way the platform defines it; the API tables only document what a component adds on top.
