---
title: "How To Use"
description: "Learn how to use templUI via the CLI or direct imports."
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

## Tools

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

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --breakpoint-3xl: 1600px;
  --breakpoint-4xl: 2000px;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
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
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
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
  --radius: 0.65rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
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
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border;
    scrollbar-width: thin;
    scrollbar-color: var(--color-muted-foreground) transparent;
  }
  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  *::-webkit-scrollbar-thumb {
    background: var(--color-muted-foreground);
    border-radius: 4px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: var(--color-foreground);
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

> **💡 Tip:** For custom themes and color palettes, visit [/docs/themes](/docs/themes).

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

### 5. Load JavaScript

Interactive components load JavaScript explicitly in your layout.

```go
import (
  "github.com/templui/templui/components/datepicker"
)
```

```templ
<head>
  @datepicker.Script()
</head>
```

`@datepicker.Script()` loads the `datepicker` script and its direct dependencies like `calendar` and `popover`.

For debugging, you can switch to the unminified scripts during app startup:

```go
func init() {
  utils.UseUnminifiedScripts = true
}
```

```go
func main() {
  utils.UseUnminifiedScripts = true
  // setup routes, then start server
}
```

### 6. Serve Assets

Use `setupAssetsRoutes(...)` to serve your app assets like Tailwind CSS output, fonts, images, and local files. In the import workflow, this is also where you mount templUI's embedded component scripts.

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

  // templUI embedded component scripts
  utils.SetupScriptRoutes(mux, isDevelopment)
}
```

Your Go app must serve `/assets/...` so the browser can load `assets/css/output.css`, fonts, images, and local files. For import-based apps, `utils.SetupScriptRoutes(...)` adds templUI's embedded component scripts.

For a complete import-based app setup, see [`templui/templui-quickstart`](https://github.com/templui/templui-quickstart).

## CLI Workflow

Use this when you want templUI to copy component source into your own project for you.

### 1. Install CLI

```shell
go install github.com/templui/templui/cmd/templui@latest
templui --version
```

### 2. Initialize Project

```shell
templui init
```

This creates `.templui.json` in your project root.

### 3. Config File

After running `templui init`, `.templui.json` is created:

```json
{
  "componentsDir": "components",
  "utilsDir": "utils",
  "moduleName": "your-app/module",
  "jsDir": "assets/js",
  "jsPublicPath": "/assets/js"
}
```

**Configuration:**

- `componentsDir` - templ components location (relative to project root)
- `utilsDir` - Utility Go files location
- `moduleName` - Your Go module name (for import paths)
- `jsDir` - JavaScript files disk location
- `jsPublicPath` _(optional)_ - Public URL path for serving JS files

**jsPublicPath examples:**
- `"/assets/js"` → yoursite.com/assets/js/
- `"/app/static/js"` → yoursite.com/app/static/js/
- `"/static"` → yoursite.com/static/

> **📝 Note:** If not set, defaults to `"/" + jsDir`

### 4. Base Styles

Create `assets/css/input.css`:

This is your Tailwind entry file. Tailwind reads it and writes the compiled result to `assets/css/output.css`.

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --breakpoint-3xl: 1600px;
  --breakpoint-4xl: 2000px;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
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
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
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
  --radius: 0.65rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
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
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border;
    scrollbar-width: thin;
    scrollbar-color: var(--color-muted-foreground) transparent;
  }
  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  *::-webkit-scrollbar-thumb {
    background: var(--color-muted-foreground);
    border-radius: 4px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: var(--color-foreground);
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

> **💡 Tip:** For custom themes and color palettes, visit [/docs/themes](/docs/themes).

### 5. Create Taskfile

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

> **📝 Note:** The Tailwind CSS standalone CLI is required for this workflow.

> **📝 Note:** Adjust the `--proxy` port (default: 8090) if your app uses a different port. templ's dev server runs at http://localhost:7331

### 6. Add Components

Install components and their dependencies:

```shell
# Specific components
templui add button card

# All components
templui add "*"

# From specific version
templui add@main button
templui add@v0.84.0 dialog
```

### 7. Use a component

```go
import "your-app/components/button"
```

```templ
@button.Button() {
  Click me
}
```

### 8. Load JavaScript

Load JavaScript explicitly in your layout:

```go
import (
  "your-app/components/datepicker"
)
```

```templ
<head>
  @datepicker.Script()
</head>
```

`templui add` downloads both the matching `.js` and `.min.js` files into your project. By default `@component.Script()` uses the minified file. For debugging, set `utils.UseUnminifiedScripts = true` during app startup, either in `init()` or early in `main()`.

```go
func init() {
  utils.UseUnminifiedScripts = true
}
```

```go
func main() {
  utils.UseUnminifiedScripts = true
  // setup routes, then start server
}
```

### 9. Serve Assets

Use `setupAssetsRoutes(...)` to serve your app assets like Tailwind CSS output, fonts, images, and local files. In the CLI workflow, your normal asset setup also serves the copied templUI `.min.js` files from `jsDir` and `jsPublicPath`:

```go
func setupAssetsRoutes(mux *http.ServeMux) {
  isDevelopment := os.Getenv("GO_ENV") != "production"

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
}
```

`templui init` installs the shared utils files. `templui add` downloads both script variants into your configured `jsDir`, and the copied `utils/templui.go` already points each `@component.Script()` call at your configured `jsPublicPath`.

### 10. Update Components

Update all installed components at once:

```shell
templui --installed add              # Update all installed components
templui --installed add@v1.0.0      # Update to specific version
templui --force --installed add       # Force without prompts
```

Or update specific components:

```shell
templui add carousel       # Prompts for confirmation
templui --force add carousel    # Force without prompts
```

> **⚠️ Warning:** Updates overwrite custom modifications. Always backup your changes first.

### 11. List Components

View all available components:

```shell
templui list              # Latest version
templui list@v0.1.0       # Specific version
```

### 12. Upgrade

Update the CLI and utils:

```shell
templui upgrade              # Latest version
templui upgrade@v0.84.0      # Specific version
```

This updates both the CLI tool and `utils/templui.go` to ensure you have the latest helper functions.
