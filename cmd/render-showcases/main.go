package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/a-h/templ"
	"github.com/templui/templui/internal/ui/showcase"
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
		"out/showcase/accordion_default.html":  showcase.AccordionDefault(),
		"out/showcase/accordion_multiple.html": showcase.AccordionMultiple(),
		"out/showcase/accordion_disabled.html": showcase.AccordionDisabled(),
		"out/showcase/accordion_borders.html":  showcase.AccordionBorders(),
		"out/showcase/accordion_card.html":     showcase.AccordionCard(),

		// Alert
		"out/showcase/alert_default.html":     showcase.AlertDefault(),
		"out/showcase/alert_destructive.html": showcase.AlertDestructive(),

		// Aspect Ratio
		"out/showcase/aspect_ratio_default.html": showcase.AspectRatioDefault(),

		// Avatar
		"out/showcase/avatar_default.html":   showcase.AvatarDefault(),
		"out/showcase/avatar_fallback.html":  showcase.AvatarFallback(),
		"out/showcase/avatar_group.html":     showcase.AvatarGroup(),
		"out/showcase/avatar_sizes.html":     showcase.AvatarSizes(),
		"out/showcase/avatar_with_icon.html": showcase.AvatarWithIcon(),

		// Badge
		"out/showcase/badge_default.html":     showcase.BadgeDefault(),
		"out/showcase/badge_destructive.html": showcase.BadgeDestructive(),
		"out/showcase/badge_outline.html":     showcase.BadgeOutline(),
		"out/showcase/badge_secondary.html":   showcase.BadgeSecondary(),
		"out/showcase/badge_with_icon.html":   showcase.BadgeWithIcon(),

		// Breadcrumb
		"out/showcase/breadcrumb_custom_separator.html": showcase.BreadcrumbCustomSeparator(),
		"out/showcase/breadcrumb_default.html":          showcase.BreadcrumbDefault(),
		"out/showcase/breadcrumb_responsive.html":       showcase.BreadcrumbResponsive(),
		"out/showcase/breadcrumb_with_icons.html":       showcase.BreadcrumbWithIcons(),

		// Button
		"out/showcase/button_default.html":     showcase.ButtonDefault(),
		"out/showcase/button_destructive.html": showcase.ButtonDestructive(),
		"out/showcase/button_ghost.html":       showcase.ButtonGhost(),
		"out/showcase/button_icon.html":        showcase.ButtonIcon(),
		"out/showcase/button_link.html":        showcase.ButtonLink(),
		"out/showcase/button_loading.html":     showcase.ButtonLoading(),
		"out/showcase/button_outline.html":     showcase.ButtonOutline(),
		"out/showcase/button_primary.html":     showcase.ButtonPrimary(),
		"out/showcase/button_secondary.html":   showcase.ButtonSecondary(),
		"out/showcase/button_sizes.html":       showcase.ButtonSizes(),
		"out/showcase/button_with_icon.html":   showcase.ButtonWithIcon(),

		// Calendar
		"out/showcase/calendar_default.html": showcase.CalendarDefault(),
		"out/showcase/calendar_range.html":   showcase.CalendarRange(),
		"out/showcase/calendar_sizes.html":   showcase.CalendarSizes(),

		// Card
		"out/showcase/card_default.html":    showcase.CardDefault(),
		"out/showcase/card_with_image.html": showcase.CardWithImage(),

		// Carousel
		"out/showcase/carousel_default.html": showcase.CarouselDefault(),

		// Chart
		"out/showcase/chart_area.html":             showcase.ChartArea(),
		"out/showcase/chart_area_linear.html":      showcase.ChartAreaLinear(),
		"out/showcase/chart_area_stacked.html":     showcase.ChartAreaStacked(),
		"out/showcase/chart_area_step.html":        showcase.ChartAreaStep(),
		"out/showcase/chart_bar_horizontal.html":   showcase.ChartBarHorizontal(),
		"out/showcase/chart_bar_multiple.html":     showcase.ChartBarMultiple(),
		"out/showcase/chart_bar_negative.html":     showcase.ChartBarNegative(),
		"out/showcase/chart_bar_stacked.html":      showcase.ChartBarStacked(),
		"out/showcase/chart_default.html":          showcase.ChartDefault(),
		"out/showcase/chart_doughnut.html":         showcase.ChartDoughnut(),
		"out/showcase/chart_doughnut_legend.html":  showcase.ChartDoughnutLegend(),
		"out/showcase/chart_doughnut_stacked.html": showcase.ChartDoughnutStacked(),
		"out/showcase/chart_line.html":             showcase.ChartLine(),
		"out/showcase/chart_line_linear.html":      showcase.ChartLineLinear(),
		"out/showcase/chart_line_multiple.html":    showcase.ChartLineMultiple(),
		"out/showcase/chart_line_step.html":        showcase.ChartLineStep(),
		"out/showcase/chart_pie.html":              showcase.ChartPie(),
		"out/showcase/chart_pie_legend.html":       showcase.ChartPieLegend(),
		"out/showcase/chart_pie_stacked.html":      showcase.ChartPieStacked(),
		"out/showcase/chart_radar.html":            showcase.ChartRadar(),
		"out/showcase/chart_radar_stacked.html":    showcase.CharRadarStacked(),

		// Checkbox
		"out/showcase/checkbox_default.html":       showcase.CheckboxDefault(),
		"out/showcase/checkbox_form.html":          showcase.CheckboxForm(),
		"out/showcase/checkbox_indeterminate.html": showcase.CheckboxIndeterminate(),

		// Collapsible
		"out/showcase/collapsible_default.html": showcase.CollapsibleDefault(),

		// CopyButton
		"out/showcase/copybutton_default.html":    showcase.CopyButtonDefault(),
		"out/showcase/copybutton_with_input.html": showcase.CopyButtonWithInput(),

		// Date Picker
		"out/showcase/date_picker_custom_placeholder.html": showcase.DatePickerCustomPlaceholder(),
		"out/showcase/date_picker_default.html":            showcase.DatePickerDefault(),
		"out/showcase/date_picker_disabled.html":           showcase.DatePickerDisabled(),
		"out/showcase/date_picker_form.html":               showcase.DatePickerForm(),
		"out/showcase/date_picker_formats.html":            showcase.DatePickerFormats(),
		"out/showcase/date_picker_range.html":              showcase.DatePickerRange(),
		"out/showcase/date_picker_selected_date.html":      showcase.DatePickerSelectedDate(),
		"out/showcase/date_picker_with_label.html":         showcase.DatePickerWithLabel(),
		"out/showcase/date_picker_with_time.html":          showcase.DatePickerWithTime(),

		// Sheet
		"out/showcase/sheet_default.html":          showcase.SheetDefault(),
		"out/showcase/sheet_sides.html":            showcase.SheetSides(),
		"out/showcase/sheet_external_trigger.html": showcase.SheetExternalTrigger(),

		// Dropdown
		"out/showcase/dropdown_default.html": showcase.DropdownDefault(),

		// Icon
		"out/showcase/icon_colored.html": showcase.IconColored(),
		"out/showcase/icon_default.html": showcase.IconDefault(),
		"out/showcase/icon_filled.html":  showcase.IconFilled(),
		"out/showcase/icon_sizes.html":   showcase.IconSizes(),

		// Input
		"out/showcase/input_default.html":      showcase.InputDefault(),
		"out/showcase/input_disabled.html":     showcase.InputDisabled(),
		"out/showcase/input_file.html":         showcase.InputFile(),
		"out/showcase/input_form.html":         showcase.InputForm(),
		"out/showcase/input_password.html":     showcase.InputPassword(),
		"out/showcase/input_time_default.html": showcase.InputTimeDefault(),
		"out/showcase/input_time_styled.html":  showcase.InputTimeStyled(),
		"out/showcase/input_with_label.html":   showcase.InputWithLabel(),

		// Input OTP
		"out/showcase/input_otp_custom_length.html":  showcase.InputOTPCustomLength(),
		"out/showcase/input_otp_custom_styling.html": showcase.InputOTPCustomStyling(),
		"out/showcase/input_otp_default.html":        showcase.InputOTPDefault(),
		"out/showcase/input_otp_form.html":           showcase.InputOTPForm(),
		"out/showcase/input_otp_password_type.html":  showcase.InputOTPPasswordType(),
		"out/showcase/input_otp_placeholder.html":    showcase.InputOTPPlaceholder(),
		"out/showcase/input_otp_with_label.html":     showcase.InputOTPWithLabel(),

		// Dialog
		"out/showcase/dialog_default.html":          showcase.DialogDefault(),
		"out/showcase/dialog_external_trigger.html": showcase.DialogExternalTrigger(),
		"out/showcase/dialog_no_modal.html":         showcase.DialogNoModal(),

		// Pagination
		"out/showcase/pagination_default.html":     showcase.PaginationDefault(),
		"out/showcase/pagination_with_helper.html": showcase.PaginationWithHelper(),

		// Popover
		"out/showcase/popover_default.html":   showcase.PopoverDefault(),
		"out/showcase/popover_positions.html": showcase.PopoverPositions(),
		"out/showcase/popover_triggers.html":  showcase.PopoverTriggers(),

		// Progress
		"out/showcase/progress_variants.html": showcase.ProgressVariants(),
		"out/showcase/progress_default.html":  showcase.ProgressDefault(),
		"out/showcase/progress_sizes.html":    showcase.ProgressSizes(),

		// Radio
		"out/showcase/radio_default.html": showcase.RadioDefault(),
		"out/showcase/radio_form.html":    showcase.RadioForm(),

		// Rating
		"out/showcase/rating_default.html":    showcase.RatingDefault(),
		"out/showcase/rating_form.html":       showcase.RatingForm(),
		"out/showcase/rating_max_values.html": showcase.RatingMaxValues(),
		"out/showcase/rating_precision.html":  showcase.RatingPrecision(),
		"out/showcase/rating_styles.html":     showcase.RatingStyles(),
		"out/showcase/rating_with_label.html": showcase.RatingWithLabel(),

		// Select Box
		"out/showcase/select_box_default.html":    showcase.SelectBoxDefault(),
		"out/showcase/select_box_disabled.html":   showcase.SelectBoxDisabled(),
		"out/showcase/select_box_form.html":       showcase.SelectBoxForm(),
		"out/showcase/select_box_multiple.html":   showcase.SelectBoxMultipleSelect(),
		"out/showcase/select_box_no_search.html":  showcase.SelectBoxNoSearch(),
		"out/showcase/select_box_pills.html":      showcase.SelectBoxMultipleSelectPills(),
		"out/showcase/select_box_with_label.html": showcase.SelectBoxWithLabel(),

		// Separator
		"out/showcase/separator_decorated.html": showcase.SeparatorDecorated(),
		"out/showcase/separator_default.html":   showcase.SeparatorDefault(),
		"out/showcase/separator_label.html":     showcase.SeparatorLabel(),
		"out/showcase/separator_vertical.html":  showcase.SeparatorVertical(),

		// Sidebar
		"out/showcase/sidebar_default.html": showcase.SidebarDefault(),

		// Skeleton
		"out/showcase/skeleton_card.html":      showcase.SkeletonCard(),
		"out/showcase/skeleton_dashboard.html": showcase.SkeletonDashboard(),
		"out/showcase/skeleton_default.html":   showcase.SkeletonDefault(),
		"out/showcase/skeleton_profile.html":   showcase.SkeletonProfile(),

		// Slider
		"out/showcase/slider_default.html":        showcase.SliderDefault(),
		"out/showcase/slider_disabled.html":       showcase.SliderDisabled(),
		"out/showcase/slider_external_value.html": showcase.SliderExternalValue(),
		"out/showcase/slider_range.html":          showcase.SliderRange(),
		"out/showcase/slider_steps.html":          showcase.SliderSteps(),
		"out/showcase/slider_value.html":          showcase.SliderValue(),

		// Table
		"out/showcase/table.html": showcase.Table(),

		// Tabs
		"out/showcase/tabs_default.html": showcase.TabsDefault(),

		// Tags Input
		"out/showcase/tagsinput_default.html":     showcase.TagsInputDefault(),
		"out/showcase/tagsinput_suggestions.html": showcase.TagsInputSuggestions(),
		"out/showcase/tagsinput_disabled.html":    showcase.TagsInputDisabled(),
		"out/showcase/tagsinput_form.html":        showcase.TagsInputForm(),
		"out/showcase/tagsinput_with_label.html":  showcase.TagsInputWithLabel(),

		// Textarea
		"out/showcase/textarea_auto_resize.html": showcase.TextareaAutoResize(),
		"out/showcase/textarea_custom_rows.html": showcase.TextareaCustomRows(),
		"out/showcase/textarea_default.html":     showcase.TextareaDefault(),
		"out/showcase/textarea_disabled.html":    showcase.TextareaDisabled(),
		"out/showcase/textarea_form.html":        showcase.TextareaForm(),
		"out/showcase/textarea_with_label.html":  showcase.TextareaWithLabel(),

		// Time Picker
		"out/showcase/time_picker_12hour.html":             showcase.TimePicker12Hour(),
		"out/showcase/time_picker_custom_placeholder.html": showcase.TimePickerCustomPlaceholder(),
		"out/showcase/time_picker_default.html":            showcase.TimePickerDefault(),
		"out/showcase/time_picker_form.html":               showcase.TimePickerForm(),
		"out/showcase/time_picker_label.html":              showcase.TimePickerLabel(),
		"out/showcase/time_picker_min_max.html":            showcase.TimePickerMinMax(),
		"out/showcase/time_picker_selected_time.html":      showcase.TimePickerSelectedTime(),
		"out/showcase/time_picker_step.html":               showcase.TimePickerStep(),

		// Toast
		"out/showcase/toast_default.html":    showcase.ToastDefault(),
		"out/showcase/toast_playground.html": showcase.ToastPlayground(),

		// Switch
		"out/showcase/switch_default.html": showcase.SwitchDefault(),
		"out/showcase/switch_form.html":    showcase.SwitchForm(),

		// Tooltip
		"out/showcase/tooltip_default.html":   showcase.TooltipDefault(),
		"out/showcase/tooltip_positions.html": showcase.TooltipPositions(),
	}

	for path, comp := range showcases {
		fmt.Println("Rendering:", path)
		if err := writeHTML(path, comp); err != nil {
			fmt.Fprintf(os.Stderr, "❌ Error rendering %s: %v\n", path, err)
		}
	}
}
