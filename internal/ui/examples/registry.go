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
	"accordion-demo": {Component: AccordionDemo(), File: "accordion_demo.templ"},
	"accordion-basic": {Component: AccordionBasic(), File: "accordion_basic.templ"},
	"accordion-multiple": {Component: AccordionMultiple(), File: "accordion_multiple.templ"},
	"accordion-disabled": {Component: AccordionDisabled(), File: "accordion_disabled.templ"},
	"accordion-borders": {Component: AccordionBorders(), File: "accordion_borders.templ"},
	"accordion-card": {Component: AccordionCard(), File: "accordion_card.templ"},
	"alert-demo": {Component: AlertDemo(), File: "alert_demo.templ"},
	"alert-basic": {Component: AlertBasic(), File: "alert_basic.templ"},
	"alert-destructive": {Component: AlertDestructive(), File: "alert_destructive.templ"},
	"alert-action": {Component: AlertAction(), File: "alert_action.templ"},
	"alert-colors": {Component: AlertColors(), File: "alert_colors.templ"},
	"aspect-ratio-demo": {Component: AspectRatioDemo(), File: "aspect_ratio_demo.templ"},
	"aspect-ratio-square": {Component: AspectRatioSquare(), File: "aspect_ratio_square.templ"},
	"aspect-ratio-portrait": {Component: AspectRatioPortrait(), File: "aspect_ratio_portrait.templ"},
	"avatar-demo": {Component: AvatarDemo(), File: "avatar_demo.templ"},
	"avatar-basic": {Component: AvatarBasic(), File: "avatar_basic.templ"},
	"avatar-badge": {Component: AvatarBadgeExample(), File: "avatar_badge.templ"},
	"avatar-badge-icon": {Component: AvatarBadgeIcon(), File: "avatar_badge_icon.templ"},
	"avatar-group": {Component: AvatarGroup(), File: "avatar_group.templ"},
	"avatar-group-count": {Component: AvatarGroupCount(), File: "avatar_group_count.templ"},
	"avatar-group-count-icon": {Component: AvatarGroupCountIcon(), File: "avatar_group_count_icon.templ"},
	"avatar-size": {Component: AvatarSize(), File: "avatar_size.templ"},
	"avatar-dropdown": {Component: AvatarDropdown(), File: "avatar_dropdown.templ"},
	"badge-demo": {Component: BadgeDemo(), File: "badge_demo.templ"},
	"badge-variants": {Component: BadgeVariants(), File: "badge_variants.templ"},
	"badge-icon": {Component: BadgeIcon(), File: "badge_icon.templ"},
	"badge-spinner": {Component: BadgeSpinner(), File: "badge_spinner.templ"},
	"badge-link": {Component: BadgeLink(), File: "badge_link.templ"},
	"badge-colors": {Component: BadgeColors(), File: "badge_colors.templ"},
	"breadcrumb-demo": {Component: BreadcrumbDemo(), File: "breadcrumb_demo.templ"},
	"breadcrumb-basic": {Component: BreadcrumbBasic(), File: "breadcrumb_basic.templ"},
	"breadcrumb-separator": {Component: BreadcrumbSeparator(), File: "breadcrumb_separator.templ"},
	"breadcrumb-dropdown": {Component: BreadcrumbDropdown(), File: "breadcrumb_dropdown.templ"},
	"breadcrumb-ellipsis": {Component: BreadcrumbEllipsisDemo(), File: "breadcrumb_ellipsis.templ"},
	"breadcrumb-link": {Component: BreadcrumbLink(), File: "breadcrumb_link.templ"},
	"button-demo":        {Component: ButtonDemo(), File: "button_demo.templ"},
	"button-size":        {Component: ButtonSize(), File: "button_size.templ"},
	"button-default":     {Component: ButtonDefault(), File: "button_default.templ"},
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
	"button-render":      {Component: ButtonRender(), File: "button_render.templ"},
}
