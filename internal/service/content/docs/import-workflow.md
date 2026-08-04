---
title: "Import Workflow"
description: "Use templui as a plain Go module dependency."
---

> **📝 Note:** This page is a templui extra, not part of the shadcn-parity docs. The standard workflow is the [CLI](/docs/installation): it copies component source into your app so you own and edit it, exactly like shadcn. The import workflow instead consumes templui like any Go library — no copied files, updates via `go get`, customization by wrapping components rather than editing them.

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

The same tools as the CLI workflow: see [Installation → Configure templ, Tailwind CSS and Task](/docs/installation#configure-templ-tailwind-css-and-task).

## Setup

### 1. Add templui

```shell
go get github.com/templui/templui/v2@latest
```

You can also just import a component package and run `go mod tidy`.

### 2. Initialize Styles

Style setup is the same `templui init` as in the [CLI workflow](/docs/installation#run-the-cli): it creates `assets/css/globals.css` and merges your theme variables and base layer into it. Pick a design on [templui.io/create](https://templui.io/create) and pass its preset code, or use one of the named presets:

```shell
go install github.com/templui/templui/v2/cmd/templui@latest
templui init
```

Then add one line to `assets/css/globals.css`, right after the tailwindcss import:

```css
@import "tailwindcss";
@import "./sources.generated.css";
```

`sources.generated.css` is written by the `tailwind` task in the next step: it pulls the component styles (`style-nova.css`), the shared `shadcn/tailwind.css` layer and the `tw-animate-css` utilities straight from the templui module and registers the `.templ` sources for scanning.

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
        TEMPLUI_PATH="$(go list -mod=mod -m -f {{`'{{.Dir}}'`}} github.com/templui/templui/v2)" && \
        printf '%s\n' \
          "@import \"$TEMPLUI_PATH/assets/css/tw-animate.css\";" \
          "@import \"$TEMPLUI_PATH/assets/css/shadcn-tailwind.css\";" \
          "@import \"$TEMPLUI_PATH/assets/css/styles/style-nova.css\" layer(base);" \
          '@source "./**/*.templ";' \
          "@source \"$TEMPLUI_PATH/components/**/*.templ\";" \
          > ./assets/css/sources.generated.css && \
        tailwindcss -i ./assets/css/globals.css -o ./assets/css/output.css --watch

  dev:
    desc: Start development server with hot reload
    cmds:
      - task --parallel tailwind templ
```

Run everything with:

```shell
task dev
```

### 4. Activate a style

Components carry `cn-*` classes; the style class on `<body>` picks which of the eight styles renders them (`style-nova`, `style-vega`, `style-maia`, `style-lyra`, `style-mira`, `style-luma`, `style-sera`, `style-rhea`). Use the style from your `components.json` (init writes it, `nova` by default) and import the matching `style-<name>.css` in the `tailwind` task above — the snippets use `style-nova`:

```templ
<body class="style-nova">
```

### 5. Import and use a component

```go
import "github.com/templui/templui/v2/components/button"
```

```templ
@button.Button() {
  Click me
}
```

## JavaScript and Assets

The script bundle and asset serving are identical in both workflows: see [Installation → JavaScript](/docs/installation#javascript) and [Installation → Serve Assets](/docs/installation#serve-assets).

For a complete import-based app setup, see [`templui/templui-quickstart`](https://github.com/templui/templui-quickstart).
