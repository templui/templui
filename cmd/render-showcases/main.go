package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/a-h/templ"
	"github.com/templui/templui/internal/ui/examples"
)

func writeHTML(filename string, c templ.Component) error {
	err := os.MkdirAll(filepath.Dir(filename), os.ModePerm)
	if err != nil {
		return err
	}

	f, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer f.Close()

	// ✅ Use context.Background() instead of nil
	return c.Render(context.Background(), f)
}

func main() {
	showcases := map[string]templ.Component{
		// Accordion
		"out/showcase/accordion_demo.html": examples.AccordionDemo(),
		"out/showcase/accordion_basic.html": examples.AccordionBasic(),
		"out/showcase/accordion_multiple.html": examples.AccordionMultiple(),
		"out/showcase/accordion_disabled.html": examples.AccordionDisabled(),
		"out/showcase/accordion_borders.html": examples.AccordionBorders(),
		"out/showcase/accordion_card.html": examples.AccordionCard(),

		// Alert
		"out/showcase/alert_demo.html": examples.AlertDemo(),
		"out/showcase/alert_basic.html": examples.AlertBasic(),
		"out/showcase/alert_destructive.html": examples.AlertDestructive(),
		"out/showcase/alert_action.html": examples.AlertAction(),
		"out/showcase/alert_colors.html": examples.AlertColors(),

		// Aspect Ratio
		"out/showcase/aspect_ratio_demo.html": examples.AspectRatioDemo(),
		"out/showcase/aspect_ratio_square.html": examples.AspectRatioSquare(),
		"out/showcase/aspect_ratio_portrait.html": examples.AspectRatioPortrait(),

		// Avatar
		"out/showcase/avatar_demo.html": examples.AvatarDemo(),
		"out/showcase/avatar_basic.html": examples.AvatarBasic(),
		"out/showcase/avatar_badge.html": examples.AvatarBadgeExample(),
		"out/showcase/avatar_badge_icon.html": examples.AvatarBadgeIcon(),
		"out/showcase/avatar_group.html": examples.AvatarGroup(),
		"out/showcase/avatar_group_count.html": examples.AvatarGroupCount(),
		"out/showcase/avatar_group_count_icon.html": examples.AvatarGroupCountIcon(),
		"out/showcase/avatar_size.html": examples.AvatarSize(),
		"out/showcase/avatar_dropdown.html": examples.AvatarDropdown(),

		// Badge
		"out/showcase/badge_demo.html": examples.BadgeDemo(),
		"out/showcase/badge_variants.html": examples.BadgeVariants(),
		"out/showcase/badge_icon.html": examples.BadgeIcon(),
		"out/showcase/badge_spinner.html": examples.BadgeSpinner(),
		"out/showcase/badge_link.html": examples.BadgeLink(),
		"out/showcase/badge_colors.html": examples.BadgeColors(),

		// Breadcrumb
		"out/showcase/breadcrumb_demo.html": examples.BreadcrumbDemo(),
		"out/showcase/breadcrumb_basic.html": examples.BreadcrumbBasic(),
		"out/showcase/breadcrumb_separator.html": examples.BreadcrumbSeparator(),
		"out/showcase/breadcrumb_dropdown.html": examples.BreadcrumbDropdown(),
		"out/showcase/breadcrumb_ellipsis.html": examples.BreadcrumbEllipsisDemo(),
		"out/showcase/breadcrumb_link.html": examples.BreadcrumbLink(),

		// Button
		"out/showcase/button_demo.html":        examples.ButtonDemo(),
		"out/showcase/button_destructive.html": examples.ButtonDestructive(),
		"out/showcase/button_ghost.html":       examples.ButtonGhost(),
		"out/showcase/button_icon.html":        examples.ButtonIcon(),
		"out/showcase/button_link.html":        examples.ButtonLink(),
		"out/showcase/button_outline.html":     examples.ButtonOutline(),
		"out/showcase/button_default.html":     examples.ButtonDefault(),
		"out/showcase/button_rounded.html":     examples.ButtonRounded(),
		"out/showcase/button_secondary.html":   examples.ButtonSecondary(),
		"out/showcase/button_size.html":        examples.ButtonSize(),
		"out/showcase/button_spinner.html":     examples.ButtonSpinner(),
		"out/showcase/button_with_icon.html":   examples.ButtonWithIcon(),

		// Calendar
		"out/showcase/calendar_demo.html":      examples.CalendarDemo(),
		"out/showcase/calendar_range.html":        examples.CalendarRange(),
		"out/showcase/calendar_caption.html":      examples.CalendarCaption(),
		"out/showcase/calendar_presets.html":      examples.CalendarPresets(),
		"out/showcase/calendar_time.html":         examples.CalendarTime(),
		"out/showcase/calendar_booked_dates.html": examples.CalendarBookedDates(),
		"out/showcase/calendar_custom_days.html": examples.CalendarCustomCellSize(),
		"out/showcase/calendar_week_numbers.html": examples.CalendarWeekNumbers(),

		// Date Picker
		"out/showcase/date_picker_demo.html": examples.DatePickerDemo(),
		"out/showcase/date_picker_basic.html":   examples.DatePickerBasic(),
		"out/showcase/date_picker_range.html":   examples.DatePickerRange(),
		"out/showcase/date_picker_dob.html":     examples.DatePickerDob(),
		"out/showcase/date_picker_input.html":   examples.DatePickerInput(),
		"out/showcase/date_picker_time.html":    examples.DatePickerTime(),

		// Card
		"out/showcase/card_demo.html": examples.CardDemo(),
		"out/showcase/card_small.html": examples.CardSmall(),
		"out/showcase/card_spacing.html": examples.CardSpacing(),
		"out/showcase/card_edge_to_edge.html": examples.CardEdgeToEdge(),
		"out/showcase/card_image.html": examples.CardImage(),

		// Carousel
		"out/showcase/carousel_demo.html": examples.CarouselDemo(),
		"out/showcase/carousel_size.html": examples.CarouselSize(),
		"out/showcase/carousel_spacing.html": examples.CarouselSpacing(),
		"out/showcase/carousel_orientation.html": examples.CarouselOrientation(),
		"out/showcase/carousel_api.html": examples.CarouselApi(),
		"out/showcase/carousel_plugin.html": examples.CarouselPlugin(),

		// Chart
		"out/showcase/chart_area.html":             examples.ChartArea(),
		"out/showcase/chart_area_linear.html":      examples.ChartAreaLinear(),
		"out/showcase/chart_area_stacked.html":     examples.ChartAreaStacked(),
		"out/showcase/chart_area_step.html":        examples.ChartAreaStep(),
		"out/showcase/chart_bar_horizontal.html":   examples.ChartBarHorizontal(),
		"out/showcase/chart_bar_multiple.html":     examples.ChartBarMultiple(),
		"out/showcase/chart_bar_negative.html":     examples.ChartBarNegative(),
		"out/showcase/chart_bar_stacked.html":      examples.ChartBarStacked(),
		"out/showcase/chart_default.html":          examples.ChartDefault(),
		"out/showcase/chart_doughnut.html":         examples.ChartDoughnut(),
		"out/showcase/chart_doughnut_legend.html":  examples.ChartDoughnutLegend(),
		"out/showcase/chart_doughnut_stacked.html": examples.ChartDoughnutStacked(),
		"out/showcase/chart_line.html":             examples.ChartLine(),
		"out/showcase/chart_line_linear.html":      examples.ChartLineLinear(),
		"out/showcase/chart_line_multiple.html":    examples.ChartLineMultiple(),
		"out/showcase/chart_line_step.html":        examples.ChartLineStep(),
		"out/showcase/chart_pie.html":              examples.ChartPie(),
		"out/showcase/chart_pie_legend.html":       examples.ChartPieLegend(),
		"out/showcase/chart_pie_stacked.html":      examples.ChartPieStacked(),
		"out/showcase/chart_radar.html":            examples.ChartRadar(),
		"out/showcase/chart_radar_stacked.html":    examples.CharRadarStacked(),

		// Checkbox
		"out/showcase/checkbox_default.html": examples.CheckboxDefault(),
		"out/showcase/checkbox_demo.html": examples.CheckboxDemo(),
		"out/showcase/checkbox_basic.html": examples.CheckboxBasic(),
		"out/showcase/checkbox_invalid.html": examples.CheckboxInvalid(),
		"out/showcase/checkbox_description.html": examples.CheckboxDescription(),
		"out/showcase/checkbox_disabled.html": examples.CheckboxDisabled(),
		"out/showcase/checkbox_group.html": examples.CheckboxGroup(),
		"out/showcase/checkbox_table.html": examples.CheckboxTable(),

		// Collapsible
		"out/showcase/collapsible_demo.html": examples.CollapsibleDemo(),
		"out/showcase/collapsible_basic.html": examples.CollapsibleBasic(),
		"out/showcase/collapsible_settings.html": examples.CollapsibleSettings(),
		"out/showcase/collapsible_file_tree.html": examples.CollapsibleFileTree(),



		// Combobox
		"out/showcase/combobox_demo.html":        examples.ComboboxDemo(),
		"out/showcase/combobox_basic.html":          examples.ComboboxBasic(),
		"out/showcase/combobox_multiple.html":       examples.ComboboxMultiple(),
		"out/showcase/combobox_clear.html":          examples.ComboboxClear(),
		"out/showcase/combobox_groups.html":         examples.ComboboxGroups(),
		"out/showcase/combobox_custom.html":         examples.ComboboxCustom(),
		"out/showcase/combobox_invalid.html":        examples.ComboboxInvalid(),
		"out/showcase/combobox_disabled.html":       examples.ComboboxDisabled(),
		"out/showcase/combobox_auto_highlight.html": examples.ComboboxAutoHighlight(),
		"out/showcase/combobox_popup.html":          examples.ComboboxPopup(),
		"out/showcase/combobox_input_group.html":    examples.ComboboxInputGroup(),

		// Select
		"out/showcase/select_demo.html":        examples.SelectDemo(),
		"out/showcase/select_align_item.html": examples.SelectAlignItem(),
		"out/showcase/select_groups.html":     examples.SelectGroupsExample(),
		"out/showcase/select_scrollable.html": examples.SelectScrollable(),
		"out/showcase/select_disabled.html":   examples.SelectDisabled(),
		"out/showcase/select_invalid.html":    examples.SelectInvalid(),

		// Sheet
		"out/showcase/sheet_demo.html": examples.SheetDemo(),

		// Dropdown Menu
		"out/showcase/dropdownmenu_demo.html":          examples.DropdownMenuDemo(),
		"out/showcase/dropdownmenu_basic.html":            examples.DropdownMenuBasic(),
		"out/showcase/dropdownmenu_submenu.html":          examples.DropdownMenuSubmenu(),
		"out/showcase/dropdownmenu_shortcuts.html":        examples.DropdownMenuShortcuts(),
		"out/showcase/dropdownmenu_icons.html":            examples.DropdownMenuIcons(),
		"out/showcase/dropdownmenu_checkboxes.html":       examples.DropdownMenuCheckboxes(),
		"out/showcase/dropdownmenu_checkboxes_icons.html": examples.DropdownMenuCheckboxesIcons(),
		"out/showcase/dropdownmenu_radio_group.html":      examples.DropdownMenuRadioGroupExample(),
		"out/showcase/dropdownmenu_radio_icons.html":      examples.DropdownMenuRadioIcons(),
		"out/showcase/dropdownmenu_destructive.html":      examples.DropdownMenuDestructive(),
		"out/showcase/dropdownmenu_avatar.html":           examples.DropdownMenuAvatar(),
		"out/showcase/dropdownmenu_complex.html":          examples.DropdownMenuComplex(),

		// Icon
		"out/showcase/icon_colored.html": examples.IconColored(),
		"out/showcase/icon_demo.html": examples.IconDemo(),
		"out/showcase/icon_filled.html":  examples.IconFilled(),
		"out/showcase/icon_sizes.html":   examples.IconSizes(),

		// Input
		"out/showcase/input_demo.html":      examples.InputDemo(),
		"out/showcase/input_disabled.html":     examples.InputDisabled(),
		"out/showcase/input_file.html":         examples.InputFile(),
		"out/showcase/input_form.html":         examples.InputForm(),

		// Input OTP

		// Dialog
		"out/showcase/dialog_demo.html": examples.DialogDemo(),
		"out/showcase/dialog_close_button.html": examples.DialogCloseButton(),
		"out/showcase/dialog_no_close_button.html": examples.DialogNoCloseButton(),
		"out/showcase/dialog_sticky_footer.html": examples.DialogStickyFooter(),
		"out/showcase/dialog_scrollable_content.html": examples.DialogScrollableContent(),

		// Pagination
		"out/showcase/pagination_demo.html": examples.PaginationDemo(),

		// Popover
		"out/showcase/popover_demo.html":       examples.PopoverDemo(),
		"out/showcase/popover_basic.html":      examples.PopoverBasic(),
		"out/showcase/popover_alignments.html": examples.PopoverAlignments(),
		"out/showcase/popover_form.html":       examples.PopoverForm(),

		// Progress
		"out/showcase/progress_demo.html": examples.ProgressDemo(),

		// Radio
		"out/showcase/radio_group_demo.html": examples.RadioGroupDemo(),


		// Separator
		"out/showcase/separator_demo.html":   examples.SeparatorDemo(),
		"out/showcase/separator_vertical.html":  examples.SeparatorVertical(),

		// Sidebar
		"out/showcase/sidebar_demo.html": examples.SidebarDemo(),

		// Skeleton
		"out/showcase/skeleton_card.html":      examples.SkeletonCard(),
		"out/showcase/skeleton_default.html":   examples.SkeletonDemo(),

		// Slider
		"out/showcase/slider_demo.html":       examples.SliderDemo(),
		"out/showcase/slider_range.html":      examples.SliderRange(),
		"out/showcase/slider_multiple.html":   examples.SliderMultiple(),
		"out/showcase/slider_vertical.html":   examples.SliderVertical(),
		"out/showcase/slider_controlled.html": examples.SliderControlled(),
		"out/showcase/slider_disabled.html":   examples.SliderDisabled(),

		// Table
		"out/showcase/table.html": examples.Table(),

		// Tabs
		"out/showcase/tabs_default.html": examples.TabsDemo(),


		// Textarea
		"out/showcase/textarea_default.html":     examples.TextareaDemo(),
		"out/showcase/textarea_disabled.html":    examples.TextareaDisabled(),


		// Toast
		"out/showcase/toast_default.html":  examples.ToastDemo(),

		// Switch
		"out/showcase/switch_demo.html":        examples.SwitchDemo(),
		"out/showcase/switch_description.html": examples.SwitchDescription(),
		"out/showcase/switch_choice_card.html": examples.SwitchChoiceCard(),
		"out/showcase/switch_disabled.html":    examples.SwitchDisabled(),
		"out/showcase/switch_invalid.html":     examples.SwitchInvalid(),
		"out/showcase/switch_sizes.html":       examples.SwitchSizes(),

		// Tooltip
		"out/showcase/tooltip_default.html": examples.TooltipDemo(),
		"out/showcase/tooltip_sides.html":   examples.TooltipSides(),
	}

	for path, comp := range showcases {
		fmt.Println("Rendering:", path)
		if err := writeHTML(path, comp); err != nil {
			fmt.Fprintf(os.Stderr, "❌ Error rendering %s: %v\n", path, err)
		}
	}
}
