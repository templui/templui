---
title: "CLI"
description: "Use the templui CLI to add components to your project."
order: 7
---

The CLI installs the Go way and updates itself the same way:

```shell
go install github.com/templui/templui/cmd/templui@latest
```

## init

Use the `init` command to initialize configuration and dependencies for an existing project.

The `init` command writes `components.json`, adds the shared `utils` package, merges the theme CSS variables into your Tailwind entry file and vendors the shared stylesheets next to it. A `go.mod` is required.

```shell
templui init
```

Pick a design on [templui.io/create](/create) and pass its preset code or URL, or use one of the named presets (`nova`, `vega`, `maia`, `lyra`, `mira`, `luma`, `sera`, `rhea`):

```shell
templui init --preset b2D0wqNxT
```

**Options**

```shell
Usage:
  templui init [--preset <code|url|name>] [--base-color <color>] [--css <path>] [--force] [--silent] [--registry <url>]

Options:
  -p, --preset <code|url|name>  use a preset configuration (code, URL or name)
  --base-color <color>          override the base color
  --css <path>                  path to your Tailwind CSS entry file
  -f, --force                   force overwrite of existing configuration
  -s, --silent                  mute output
  --registry <url>              registry URL (default https://templui.io, env TEMPLUI_REGISTRY)
  -c, --cwd <cwd>               the working directory (default ".")
```

## add

Use the `add` command to add components and dependencies to your project.

```shell
templui add [component]
```

The CLI resolves registry dependencies recursively (for example `alert-dialog` pulls in `button` and `dialog`) and rewrites all imports to your module. After adding, run `templ generate` and `go mod tidy` to complete the install.

Existing files are never overwritten silently; re-run with `--overwrite` to update.

**Options**

```shell
Usage:
  templui add <components...|url> [--all] [--overwrite] [--path <path>] [--silent] [--registry <url>]

Options:
  -a, --all        add all available components
  -o, --overwrite  overwrite existing files
  -p, --path <path>  the path to add the component to
  -s, --silent     mute output
  --registry <url>  registry URL (default https://templui.io, env TEMPLUI_REGISTRY)
  -c, --cwd <cwd>  the working directory (default ".")
```

## apply

Use the `apply` command to apply a preset to an existing project.

```shell
templui apply b2D0wqNxT
```

Without `--only` this rewrites your `components.json`, your CSS variables and re-installs every installed component in the new style. You can apply only the theme or fonts from a preset without reinstalling components:

```shell
templui apply b2D0wqNxT --only theme
```

Supported values for `--only` are `theme` and `font`, also combined as `--only theme,font`.

**Options**

```shell
Usage:
  templui apply <preset> [--only theme|font] [--yes] [--silent] [--registry <url>]

Options:
  --preset <preset>  preset configuration to apply
  --only <parts>     apply only parts of a preset: theme, font
  -y, --yes          skip confirmation prompt
  -s, --silent       mute output
  --registry <url>   registry URL (default https://templui.io, env TEMPLUI_REGISTRY)
  -c, --cwd <cwd>    the working directory (default ".")
```

## preset

Use the `preset` command to inspect preset codes and resolve the preset for an existing project.

```shell
templui preset decode b2D0wqNxT
```

### preset decode

Use `preset decode` to decode a preset code and print the design it encodes.

```shell
templui preset decode b2D0wqNxT
```

**Options**

```shell
Usage:
  templui preset decode <code>

Options:
  --json  output as JSON
```

### preset resolve

Use `preset resolve` to resolve the preset from the current project, reconstructed from `components.json` and your Tailwind entry file.

```shell
templui preset resolve
```

The `preset info` command is an alias for `preset resolve`:

```shell
templui preset info
```

**Options**

```shell
Usage:
  templui preset resolve [--json]

Options:
  --json           output as JSON
  -c, --cwd <cwd>  the working directory (default ".")
```

### preset url

Use `preset url` to print the create URL for a preset code.

```shell
templui preset url b2D0wqNxT
```

```shell
https://templui.io/create?preset=b2D0wqNxT
```
