---
title: "How To Use"
description: "Learn how to integrate templUI into your projects using the CLI."
order: 2
---

## Requirements

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

**Standalone CLI (Recommended)** - Best performance, no Node.js required:
- Download from [GitHub Releases](https://github.com/tailwindlabs/tailwindcss/releases/latest)
- Or use your package manager

**Alternative:** Use via npx:

```shell
npx tailwindcss@latest
```

## Configuration

Create `assets/css/input.css` with templUI's base styles:

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

## Development

Recommended setup with hot reloading using [Task](https://taskfile.dev).

### Install Task

**Task** is a modern alternative to Make that works on all platforms.

```shell
go install github.com/go-task/task/v3/cmd/task@latest
```

> **📝 Note:** Learn more at [taskfile.dev](https://taskfile.dev)

### Create Taskfile

Create `Taskfile.yml` in your project root:

```yaml
version: "3"

vars:
  TAILWIND_CMD:
    sh: command -v tailwindcss >/dev/null 2>&1 && echo "tailwindcss" || echo "npx tailwindcss@latest"

tasks:
  templ:
    desc: Run templ with integrated server and hot reload
    cmds:
      - templ generate --watch --proxy="http://localhost:8090" --cmd="go run ./main.go" --open-browser=false

  tailwind:
    desc: Watch Tailwind CSS changes
    cmds:
      - "{{.TAILWIND_CMD}} -i ./assets/css/input.css -o ./assets/css/output.css --watch"

  dev:
    desc: Start development server with hot reload
    cmds:
      - task --parallel tailwind templ
```

> **💡 Tip:** Smart Tailwind Detection automatically uses standalone CLI if installed, falls back to `npx` - no configuration needed!

> **📝 Note:** Adjust the `--proxy` port (default: 8090) if your app uses a different port. templ's dev server runs at http://localhost:7331

### Start Dev Server

Start all development tools:

```shell
task dev
```

**This command:**
- Watches and compiles templ files
- Starts the Go server with hot reload
- Watches and compiles Tailwind CSS changes

**Run individually:**
- `task templ` - templ files + server
- `task tailwind` - Tailwind CSS only
- `task --list` - Show all tasks

## Installation

### Import Quickstart (Recommended for fast start)

Clone the repo with sparse checkout and use the ready-to-run quickstart folder:

```shell
git clone --depth 1 --filter=blob:none --sparse https://github.com/templui/templui.git myapp
cd myapp
git sparse-checkout set examples/library-mode
cd examples/library-mode
cp .env.example .env
go mod tidy
task dev
```

### Install CLI

Install the templUI CLI:

```shell
go install github.com/templui/templui/cmd/templui@latest
```

Verify installation:

```shell
templui --version
```

### Initialize Project

Initialize templUI in your project:

```shell
templui init
```

**You will be prompted for:**
- Components directory (default: `components`)
- Utils directory (default: `utils`)
- Go module name
- JavaScript directory
- JS public path (optional)

**Use specific version:**

```shell
templui init@v0.1.0  # Tag, branch, or commit
```

> **📝 Note:** This creates `.templui.json` in your project root.

### Add Components

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

> **💡 Tip:** JavaScript is included automatically by interactive components. No extra script wiring is needed.

### Update Components

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

### List Components

View all available components:

```shell
templui list              # Latest version
templui list@v0.1.0       # Specific version
```

### Upgrade

Update the CLI and utils:

```shell
templui upgrade              # Latest version
templui upgrade@v0.84.0      # Specific version
```

This updates both the CLI tool and the utils package (`utils/templui.go`) to ensure you have the latest helper functions.

## Advanced

### Config File

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

### JS Asset Routing

Use `jsPublicPath` when your server config doesn't map filesystem paths to URLs directly.

**Standard Setup (Default)**

Files in `assets/js/` served at `/assets/js/`:

```go
mux.Handle("/assets/js/", http.StripPrefix("/assets/js/",
    http.FileServer(http.Dir("./assets/js"))))
```

**App with URL Prefix**

App running under `/app/`:

```go
// Config: "jsPublicPath": "/app/assets/js"
mux.Handle("/app/assets/js/", http.StripPrefix("/app/assets/js/",
    http.FileServer(http.Dir("./assets/js"))))
```

**Custom Asset Directory**

Assets served from different path than filesystem:

```go
// Config: "jsDir": "internal/assets", "jsPublicPath": "/static"
mux.Handle("/static/", http.StripPrefix("/static/",
    http.FileServer(http.Dir("./internal/assets"))))
```

### External Docs

**Additional resources:**

- [templ](https://templ.guide) - Cache configuration, component patterns
- [Tailwind CSS](https://tailwindcss.com/docs) - Theming, plugins, optimization
