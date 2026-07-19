package examples

import "github.com/a-h/templ"

// RegistryEntry links a demo name (the shadcn mdx name, e.g. "button-demo")
// to our example component and its source file for the code block.
type RegistryEntry struct {
	Component templ.Component
	File      string
}

// Registry resolves <ComponentPreview name="..."/> shortcodes in the
// markdown component docs. Grows page by page during the docs migration.
var Registry = map[string]RegistryEntry{
	"button-demo":        {Component: ButtonDefault(), File: "button_default.templ"},
	"button-size":        {Component: ButtonSizes(), File: "button_sizes.templ"},
	"button-default":     {Component: ButtonPrimary(), File: "button_primary.templ"},
	"button-outline":     {Component: ButtonOutline(), File: "button_outline.templ"},
	"button-secondary":   {Component: ButtonSecondary(), File: "button_secondary.templ"},
	"button-ghost":       {Component: ButtonGhost(), File: "button_ghost.templ"},
	"button-destructive": {Component: ButtonDestructive(), File: "button_destructive.templ"},
	"button-link":        {Component: ButtonLink(), File: "button_link.templ"},
	"button-icon":        {Component: ButtonIcon(), File: "button_icon.templ"},
	"button-with-icon":   {Component: ButtonWithIcon(), File: "button_with_icon.templ"},
	"button-rounded":     {Component: ButtonRounded(), File: "button_rounded.templ"},
	"button-spinner":     {Component: ButtonSpinner(), File: "button_spinner.templ"},
	"button-group-demo":  {Component: ButtonGroupDefault(), File: "buttongroup_default.templ"},
	"button-render":      {Component: ButtonAsLink(), File: "button_as_link.templ"},
}
