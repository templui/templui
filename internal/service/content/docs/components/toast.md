---
title: Toast
description: A succinct message that is displayed temporarily.
---

<ComponentPreview name="toast-demo" />

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
templui add toast
```

Load the script once in your layout:

```templ
<head>
  @toast.Script()
</head>
```

</TabsContent>

<TabsContent value="manual">

<Steps className="mb-0 pt-2">

<Step>Copy and paste the following code into your project.</Step>

<ComponentSource name="toast" title="components/toast/toast.templ" />

<ComponentSource name="toast" title="components/toast/toast.js" />

Copy `toast.min.js` as well, or minify `toast.js` yourself. `toast.Script()` loads the minified file.

<Step>Add the script once to your layout.</Step>

```templ
<head>
  @toast.Script()
</head>
```

<Step>Update the import paths to match your project setup.</Step>

</Steps>

</TabsContent>

</CodeTabs>

Add the `Toaster` component to your base layout.

```templ showLineNumbers title="layout.templ"
import "github.com/templui/templui/components/toast"

templ Layout() {
	<html lang="en">
		<body>
			<main>{ children... }</main>
			@toast.Toaster()
			@toast.Script()
		</body>
	</html>
}
```

## Usage

```js showLineNumbers
const id = window.tui.toast.add({
	title: "Event created",
	description: "Sunday, December 3 at 9:00 AM",
})
```

## Types

Set the `type` option to render a status icon. The built-in renderer recognizes `success`, `info`, `warning`, `error`, and `loading`.

<ComponentPreview name="toast-types" />

## Action

Pass button props with `actionProps` to render an action.

```js showLineNumbers
const id = window.tui.toast.add({
	title: "Event created",
	actionProps: {
		children: "Undo",
		onClick() {
			window.tui.toast.close(id)
		},
	},
})
```

## Promise

Use `toast.promise` to update one toast as an asynchronous task moves through loading, success, and error states.

<ComponentPreview name="toast-promise" />

## API Reference

### Toaster

The `toast.Toaster` component hosts the toasts, mount it once in your layout.

| Prop      | Type     | Default |
| --------- | -------- | ------- |
| `Timeout` | `int`    | `5000`  |
| `Limit`   | `int`    | `3`     |
| `Class`   | `string` | -       |

### toast

The `window.tui.toast` object is the toast manager pendant.

| Function  | Signature                                    | Description                                              |
| --------- | -------------------------------------------- | -------------------------------------------------------- |
| `add`     | `(options) => id`                            | Shows a toast, options carry `title`, `description`, `type`, `timeout` and `actionProps`. |
| `close`   | `(id) => void`                               | Closes a toast.                                          |
| `promise` | `(promise, { loading, success, error }) => id` | Shows a loading toast that morphs with the promise.      |

### Toast

The `toast.Toast` component renders a toast server side, e.g. swapped in via htmx.

| Prop          | Type                                                                | Default   |
| ------------- | ------------------------------------------------------------------- | --------- |
| `Title`       | `string`                                                            | -         |
| `Description` | `string`                                                            | -         |
| `Type`        | `TypeSuccess \| TypeInfo \| TypeWarning \| TypeError \| TypeLoading` | -         |
| `Timeout`     | `int`                                                               | inherited |
