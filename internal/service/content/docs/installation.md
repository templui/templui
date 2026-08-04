---
title: "Installation"
description: "How to install dependencies and structure your app."
order: 2
---

<Callout className="mb-6 border-emerald-600 bg-emerald-100 dark:border-emerald-400 dark:bg-emerald-900">

**Recommended for new projects:** Use [templui/create](/create) to build your preset visually and generate the right setup command.

</Callout>

Choose the setup that matches your starting point.

<div class="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6" data-not-typeset>
  <a href="#scaffold-with-create" class="flex w-full flex-col items-start gap-1 rounded-2xl bg-surface p-6 text-sm text-surface-foreground transition-colors hover:bg-surface/80 sm:p-10 md:p-6">
    <div class="font-medium">Use templui/create</div>
    <div class="leading-relaxed text-muted-foreground">Build your preset and generate a templ project command.</div>
  </a>
  <a href="#scaffold-with-cli" class="flex w-full flex-col items-start gap-1 rounded-2xl bg-surface p-6 text-sm text-surface-foreground transition-colors hover:bg-surface/80 sm:p-10 md:p-6">
    <div class="font-medium">Use the CLI</div>
    <div class="leading-relaxed text-muted-foreground">Scaffold a new templ project directly from the terminal.</div>
  </a>
  <a href="#existing-project" class="flex w-full flex-col items-start gap-1 rounded-2xl bg-surface p-6 text-sm text-surface-foreground transition-colors hover:bg-surface/80 sm:p-10 md:p-6">
    <div class="font-medium">Existing Project</div>
    <div class="leading-relaxed text-muted-foreground">Configure templui manually in an existing templ project.</div>
  </a>
</div>

<div id="scaffold-with-create" class="scroll-mt-24"></div>

## Use templui/create

<Steps>

### Build Your Preset

Open [templui/create](/create) and build your preset visually. Choose your style, colors, fonts, icons, and more.

<a href="/create" target="_blank" rel="noopener noreferrer" data-not-typeset class="cn-button group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none cn-button-variant-default cn-button-size-sm mt-6 no-underline!">Open templui/create</a>

### Create Project

Click `Get Code`, choose your project tab, and copy the generated command. Set up a Go module first if you do not have one yet:

```shell
mkdir myapp && cd myapp
go mod init myapp
go install github.com/templui/templui/cmd/templui@latest
```

The generated command will look similar to this:

```shell
templui init --preset [CODE]
```

The exact command will include the preset code that encodes your selected options such as your style, base color and fonts.

### Create Taskfile

templ and Tailwind run as watchers; a `Taskfile.yml` in your project root wires them into one dev command:

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

### Add Components

Add the `Card` component to your project:

```shell
templui add card
```

The command above will add the `Card` component to your project. You can then import it like this:

```templ title="pages/home.templ" showLineNumbers
package pages

import "myapp/components/card"

templ Home() {
	@card.Card(card.Props{Class: "max-w-sm"}) {
		@card.Header() {
			@card.Title() {
				Project Overview
			}
			@card.Description() {
				Track progress and recent activity for your app.
			}
		}
		@card.Content() {
			Your design system is ready. Start building your next component.
		}
	}
}
```

After adding components, run `templ generate` and `go mod tidy`.

</Steps>

<div id="scaffold-with-cli" class="scroll-mt-24"></div>

## Use the CLI

<Steps>

### Create Project

Run the `init` command to scaffold a new templ project. Create the Go module first, then configure your project with flags: preset, base color, and more:

```shell
mkdir myapp && cd myapp
go mod init myapp
go install github.com/templui/templui/cmd/templui@latest
templui init
```

Pick a design on [templui/create](/create) and pass its preset code, or use one of the named presets (`nova`, `vega`, `maia`, `lyra`, `mira`, `luma`, `sera`, `rhea`):

```shell
templui init --preset b2D0wqNxT
templui init --preset vega
```

### Create Taskfile

templ and Tailwind run as watchers; a `Taskfile.yml` in your project root wires them into one dev command:

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

### Add Components

Add the `Card` component to your project:

```shell
templui add card
```

The command above will add the `Card` component to your project. You can then import it like this:

```templ title="pages/home.templ" showLineNumbers
package pages

import "myapp/components/card"

templ Home() {
	@card.Card(card.Props{Class: "max-w-sm"}) {
		@card.Header() {
			@card.Title() {
				Project Overview
			}
			@card.Description() {
				Track progress and recent activity for your app.
			}
		}
		@card.Content() {
			Your design system is ready. Start building your next component.
		}
	}
}
```

After adding components, run `templ generate` and `go mod tidy`.

</Steps>

<div id="existing-project" class="scroll-mt-24"></div>

## Existing Project

<Steps>

### Create Project

If you need a new Go module, create one with `go mod init`. Otherwise, skip this step.

```shell
mkdir myapp && cd myapp
go mod init myapp
```

### Configure templ, Tailwind CSS and Task

If you're adding templui to an existing templ app, make sure templ, Tailwind CSS and Task are installed first:

```shell
go install github.com/a-h/templ/cmd/templ@latest
go install github.com/go-task/task/v3/cmd/task@latest
```

The Tailwind CSS v4.1+ standalone CLI is required: download it from the [GitHub Releases](https://github.com/tailwindlabs/tailwindcss/releases/latest) or use your package manager.

Import aliases need no configuration: Go resolves imports through the `module` path in your `go.mod`. See [Package Imports](/docs/package-imports).

### Run the CLI

Run the `templui` init command to set up templui in your project:

```shell
go install github.com/templui/templui/cmd/templui@latest
templui init
```

Init writes `components.json`, merges your theme CSS variables and base layer into your Tailwind entry file (detected, or created at `assets/css/input.css`), vendors `tw-animate.css` and `shadcn-tailwind.css` next to it, and installs the shared `utils` package. See the [CLI docs](/docs/cli) for all flags, updating with `--overwrite` and applying presets.

### Create Taskfile

templ and Tailwind run as watchers; a `Taskfile.yml` in your project root wires them into one dev command:

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

### Add Components

You can now start adding components to your project.

```shell
templui add button
```

The command above will add the `Button` component to your project. You can then import it like this:

```templ title="pages/home.templ" showLineNumbers
package pages

import "myapp/components/button"

templ Home() {
	<div class="flex min-h-svh items-center justify-center">
		@button.Button() {
			Click me
		}
	</div>
}
```

After adding components, run `templ generate` and `go mod tidy`.

</Steps>

## JavaScript

templui ships all component behavior as one script bundle. The setup is a one-time step in your app, no per-component script tags.

Render the script tag once in your layout `<head>`:

```go
import "your-app/components"
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

  // templui component script bundle
  mux.Handle("GET /components/templui.js", components.ScriptsHandler())
}
```

Your Go app must serve `/assets/...` so the browser can load `assets/css/output.css`, fonts, images, and local files. The `/components/templui.js` route serves the script bundle that `@components.Scripts()` loads.

> **📝 Note:** templui also works as a plain Go module dependency without copying any source. That is a templui extra outside this page, see [Import Workflow](/docs/import-workflow).

## Component Props

Every component accepts three universal props that are left out of the per-component API tables:

| Prop         | Type               | Description                                          |
| ------------ | ------------------ | ---------------------------------------------------- |
| `ID`         | `string`           | HTML id for the rendered element.                    |
| `Class`      | `string`           | Additional CSS classes, merged with the defaults.    |
| `Attributes` | `templ.Attributes` | Additional HTML attributes spread onto the element.  |

Standard HTML behavior (`Disabled`, `Type`, `Href`, ...) works the way the platform defines it; the API tables only document what a component adds on top.
