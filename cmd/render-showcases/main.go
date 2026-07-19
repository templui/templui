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
		"out/showcase/accordion_default.html": examples.AccordionDefault(),

		// Alert
		"out/showcase/alert_default.html":     examples.AlertDefault(),
		"out/showcase/alert_destructive.html": examples.AlertDestructive(),

		// Aspect Ratio
		"out/showcase/aspect_ratio_default.html": examples.AspectRatioDefault(),

		// Avatar
		"out/showcase/avatar_default.html":   examples.AvatarDefault(),
		"out/showcase/avatar_fallback.html":  examples.AvatarFallback(),
		"out/showcase/avatar_group.html":     examples.AvatarGroup(),
		"out/showcase/avatar_sizes.html":     examples.AvatarSizes(),
		"out/showcase/avatar_with_icon.html": examples.AvatarWithIcon(),

		// Badge
		"out/showcase/badge_default.html":     examples.BadgeDefault(),
		"out/showcase/badge_destructive.html": examples.BadgeDestructive(),
		"out/showcase/badge_outline.html":     examples.BadgeOutline(),
		"out/showcase/badge_secondary.html":   examples.BadgeSecondary(),
		"out/showcase/badge_with_icon.html":   examples.BadgeWithIcon(),

		// Breadcrumb
		"out/showcase/breadcrumb_custom_separator.html": examples.BreadcrumbCustomSeparator(),
		"out/showcase/breadcrumb_default.html":          examples.BreadcrumbDefault(),
		"out/showcase/breadcrumb_responsive.html":       examples.BreadcrumbResponsive(),
		"out/showcase/breadcrumb_with_icons.html":       examples.BreadcrumbWithIcons(),

		// Button
		"out/showcase/button_default.html":     examples.ButtonDefault(),
		"out/showcase/button_destructive.html": examples.ButtonDestructive(),
		"out/showcase/button_ghost.html":       examples.ButtonGhost(),
		"out/showcase/button_icon.html":        examples.ButtonIcon(),
		"out/showcase/button_link.html":        examples.ButtonLink(),
		"out/showcase/button_outline.html":     examples.ButtonOutline(),
		"out/showcase/button_primary.html":     examples.ButtonPrimary(),
		"out/showcase/button_rounded.html":     examples.ButtonRounded(),
		"out/showcase/button_secondary.html":   examples.ButtonSecondary(),
		"out/showcase/button_sizes.html":       examples.ButtonSizes(),
		"out/showcase/button_spinner.html":     examples.ButtonSpinner(),
		"out/showcase/button_with_icon.html":   examples.ButtonWithIcon(),

		// Calendar
		"out/showcase/calendar_default.html":      examples.CalendarDefault(),
		"out/showcase/calendar_range.html":        examples.CalendarRange(),
		"out/showcase/calendar_caption.html":      examples.CalendarCaption(),
		"out/showcase/calendar_presets.html":      examples.CalendarPresets(),
		"out/showcase/calendar_time.html":         examples.CalendarTime(),
		"out/showcase/calendar_booked_dates.html": examples.CalendarBookedDates(),
		"out/showcase/calendar_custom_cell_size.html": examples.CalendarCustomCellSize(),
		"out/showcase/calendar_week_numbers.html": examples.CalendarWeekNumbers(),

		// Date Picker
		"out/showcase/date_picker_default.html": examples.DatePickerDefault(),
		"out/showcase/date_picker_basic.html":   examples.DatePickerBasic(),
		"out/showcase/date_picker_range.html":   examples.DatePickerRange(),
		"out/showcase/date_picker_dob.html":     examples.DatePickerDob(),
		"out/showcase/date_picker_input.html":   examples.DatePickerInput(),
		"out/showcase/date_picker_time.html":    examples.DatePickerTime(),

		// Card
		"out/showcase/card_default.html":    examples.CardDefault(),
		"out/showcase/card_with_image.html": examples.CardWithImage(),

		// Carousel
		"out/showcase/carousel_default.html": examples.CarouselDefault(),

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
		"out/showcase/checkbox_default.html":       examples.CheckboxDefault(),
		"out/showcase/checkbox_form.html":          examples.CheckboxForm(),
		"out/showcase/checkbox_indeterminate.html": examples.CheckboxIndeterminate(),

		// Collapsible
		"out/showcase/collapsible_default.html": examples.CollapsibleDefault(),



		// Combobox
		"out/showcase/combobox_default.html":        examples.ComboboxDefault(),
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
		"out/showcase/select_default.html":    examples.SelectDefault(),
		"out/showcase/select_align_item.html": examples.SelectAlignItem(),
		"out/showcase/select_groups.html":     examples.SelectGroupsExample(),
		"out/showcase/select_scrollable.html": examples.SelectScrollable(),
		"out/showcase/select_disabled.html":   examples.SelectDisabled(),
		"out/showcase/select_invalid.html":    examples.SelectInvalid(),

		// Sheet
		"out/showcase/sheet_default.html":          examples.SheetDefault(),
		"out/showcase/sheet_sides.html":            examples.SheetSides(),
		"out/showcase/sheet_external_trigger.html": examples.SheetExternalTrigger(),

		// Dropdown Menu
		"out/showcase/dropdownmenu_default.html":          examples.DropdownMenuDefault(),
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
		"out/showcase/icon_default.html": examples.IconDefault(),
		"out/showcase/icon_filled.html":  examples.IconFilled(),
		"out/showcase/icon_sizes.html":   examples.IconSizes(),

		// Input
		"out/showcase/input_default.html":      examples.InputDefault(),
		"out/showcase/input_disabled.html":     examples.InputDisabled(),
		"out/showcase/input_file.html":         examples.InputFile(),
		"out/showcase/input_form.html":         examples.InputForm(),
		"out/showcase/input_time_default.html": examples.InputTimeDefault(),
		"out/showcase/input_time_styled.html":  examples.InputTimeStyled(),
		"out/showcase/input_with_label.html":   examples.InputWithLabel(),

		// Input OTP
		"out/showcase/input_otp_custom_length.html":  examples.InputOTPCustomLength(),
		"out/showcase/input_otp_custom_styling.html": examples.InputOTPCustomStyling(),
		"out/showcase/input_otp_default.html":        examples.InputOTPDefault(),
		"out/showcase/input_otp_form.html":           examples.InputOTPForm(),
		"out/showcase/input_otp_password_type.html":  examples.InputOTPPasswordType(),
		"out/showcase/input_otp_placeholder.html":    examples.InputOTPPlaceholder(),
		"out/showcase/input_otp_with_label.html":     examples.InputOTPWithLabel(),

		// Dialog
		"out/showcase/dialog_default.html":          examples.DialogDefault(),
		"out/showcase/dialog_external_trigger.html": examples.DialogExternalTrigger(),
		"out/showcase/dialog_no_modal.html":         examples.DialogNoModal(),

		// Pagination
		"out/showcase/pagination_default.html":     examples.PaginationDefault(),
		"out/showcase/pagination_with_helper.html": examples.PaginationWithHelper(),

		// Popover
		"out/showcase/popover_default.html":    examples.PopoverDefault(),
		"out/showcase/popover_basic.html":      examples.PopoverBasic(),
		"out/showcase/popover_alignments.html": examples.PopoverAlignments(),
		"out/showcase/popover_form.html":       examples.PopoverForm(),

		// Progress
		"out/showcase/progress_default.html":  examples.ProgressDefault(),

		// Radio
		"out/showcase/radio_default.html": examples.RadioDefault(),
		"out/showcase/radio_form.html":    examples.RadioForm(),


		// Separator
		"out/showcase/separator_default.html":   examples.SeparatorDefault(),
		"out/showcase/separator_vertical.html":  examples.SeparatorVertical(),

		// Sidebar
		"out/showcase/sidebar_default.html": examples.SidebarDefault(),

		// Skeleton
		"out/showcase/skeleton_card.html":      examples.SkeletonCard(),
		"out/showcase/skeleton_dashboard.html": examples.SkeletonDashboard(),
		"out/showcase/skeleton_default.html":   examples.SkeletonDefault(),
		"out/showcase/skeleton_profile.html":   examples.SkeletonProfile(),

		// Slider
		"out/showcase/slider_default.html":        examples.SliderDefault(),
		"out/showcase/slider_disabled.html":       examples.SliderDisabled(),
		"out/showcase/slider_external_value.html": examples.SliderExternalValue(),
		"out/showcase/slider_range.html":          examples.SliderRange(),
		"out/showcase/slider_steps.html":          examples.SliderSteps(),
		"out/showcase/slider_value.html":          examples.SliderValue(),

		// Table
		"out/showcase/table.html": examples.Table(),

		// Tabs
		"out/showcase/tabs_default.html": examples.TabsDefault(),


		// Textarea
		"out/showcase/textarea_custom_rows.html": examples.TextareaCustomRows(),
		"out/showcase/textarea_default.html":     examples.TextareaDefault(),
		"out/showcase/textarea_disabled.html":    examples.TextareaDisabled(),
		"out/showcase/textarea_form.html":        examples.TextareaForm(),
		"out/showcase/textarea_with_label.html":  examples.TextareaWithLabel(),


		// Toast
		"out/showcase/toast_default.html":  examples.ToastDefault(),
		"out/showcase/toast_types.html":       examples.ToastTypes(),
		"out/showcase/toast_description.html": examples.ToastDescription(),
		"out/showcase/toast_position.html": examples.ToastPosition(),
		"out/showcase/toast_htmx.html":     examples.ToastHtmx(),

		// Switch
		"out/showcase/switch_default.html": examples.SwitchDefault(),
		"out/showcase/switch_form.html":    examples.SwitchForm(),

		// Tooltip
		"out/showcase/tooltip_default.html": examples.TooltipDefault(),
		"out/showcase/tooltip_sides.html":   examples.TooltipSides(),
	}

	for path, comp := range showcases {
		fmt.Println("Rendering:", path)
		if err := writeHTML(path, comp); err != nil {
			fmt.Fprintf(os.Stderr, "❌ Error rendering %s: %v\n", path, err)
		}
	}
}
