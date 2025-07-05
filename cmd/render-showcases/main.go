package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/a-h/templ"
	"github.com/axzilla/templui/internal/ui/showcase"
	"github.com/axzilla/templui/internal/ui/showcase/selectbox"
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
		"out/showcase/accordion_default.html": showcase.AccordionDefault(),

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
		"out/showcase/button_default.html":      showcase.ButtonDefault(),
		"out/showcase/button_destructive.html":  showcase.ButtonDestructive(),
		"out/showcase/button_ghost.html":        showcase.ButtonGhost(),
		"out/showcase/button_htmx_loading.html": showcase.ButtonHtmxLoading(),
		"out/showcase/button_icon.html":         showcase.ButtonIcon(),
		"out/showcase/button_link.html":         showcase.ButtonLink(),
		"out/showcase/button_loading.html":      showcase.ButtonLoading(),
		"out/showcase/button_outline.html":      showcase.ButtonOutline(),
		"out/showcase/button_primary.html":      showcase.ButtonPrimary(),
		"out/showcase/button_secondary.html":    showcase.ButtonSecondary(),
		"out/showcase/button_with_icon.html":    showcase.ButtonWithIcon(),

		// Card
		"out/showcase/card_default.html":      showcase.CardDefault(),
		"out/showcase/card_image_bottom.html": showcase.CardImageBottom(),
		"out/showcase/card_image_left.html":   showcase.CardImageLeft(),
		"out/showcase/card_image_right.html":  showcase.CardImageRight(),
		"out/showcase/card_image_top.html":    showcase.CardImageTop(),

		// Carousel
		"out/showcase/carousel_autoplay.html":    showcase.CarouselAutoplay(),
		"out/showcase/carousel_default.html":     showcase.CarouselDefault(),
		"out/showcase/carousel_minimal.html":     showcase.CarouselMinimal(),
		"out/showcase/carousel_with_images.html": showcase.CarouselWithImages(),

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

		// Checkbox
		"out/showcase/checkbox_card_default.html": showcase.CheckboxCardDefault(),
		"out/showcase/checkbox_checked.html":      showcase.CheckboxChecked(),
		"out/showcase/checkbox_custom_icon.html":  showcase.CheckboxCustomIcon(),
		"out/showcase/checkbox_default.html":      showcase.CheckboxDefault(),
		"out/showcase/checkbox_disabled.html":     showcase.CheckboxDisabled(),
		"out/showcase/checkbox_form.html":         showcase.CheckboxForm(),
		"out/showcase/checkbox_with_label.html":   showcase.CheckboxWithLabel(),

		// Code
		"out/showcase/code_copy_button.html": showcase.CodeCopyButton(),
		"out/showcase/code_custom_size.html": showcase.CodeCustomSize(),
		"out/showcase/code_default.html":     showcase.CodeDefault(),

		// Date Picker
		"out/showcase/date_picker_custom_placeholder.html": showcase.DatePickerCustomPlaceholder(),
		"out/showcase/date_picker_default.html":            showcase.DatePickerDefault(),
		"out/showcase/date_picker_disabled.html":           showcase.DatePickerDisabled(),
		"out/showcase/date_picker_form.html":               showcase.DatePickerForm(),
		"out/showcase/date_picker_formats.html":            showcase.DatePickerFormats(),
		"out/showcase/date_picker_selected_date.html":      showcase.DatePickerSelectedDate(),
		"out/showcase/date_picker_with_label.html":         showcase.DatePickerWithLabel(),

		// Drawer
		"out/showcase/drawer_default.html":   showcase.DrawerDefault(),
		"out/showcase/drawer_positions.html": showcase.DrawerPositions(),

		// Dropdown
		"out/showcase/dropdown_default.html": showcase.DropdownDefault(),

		// Icon
		"out/showcase/icon_colored.html": showcase.IconColored(),
		"out/showcase/icon_default.html": showcase.IconDefault(),
		"out/showcase/icon_filled.html":  showcase.IconFilled(),
		"out/showcase/icon_sizes.html":   showcase.IconSizes(),

		// Input
		"out/showcase/input_default.html":    showcase.InputDefault(),
		"out/showcase/input_disabled.html":   showcase.InputDisabled(),
		"out/showcase/input_file.html":       showcase.InputFile(),
		"out/showcase/input_form.html":       showcase.InputForm(),
		"out/showcase/input_with_label.html": showcase.InputWithLabel(),

		// Input OTP
		"out/showcase/input_otp_custom_length.html":  showcase.InputOTPCustomLength(),
		"out/showcase/input_otp_custom_styling.html": showcase.InputOTPCustomStyling(),
		"out/showcase/input_otp_default.html":        showcase.InputOTPDefault(),
		"out/showcase/input_otp_form.html":           showcase.InputOTPForm(),
		"out/showcase/input_otp_password_type.html":  showcase.InputOTPPasswordType(),
		"out/showcase/input_otp_placeholder.html":    showcase.InputOTPPlaceholder(),
		"out/showcase/input_otp_with_label.html":     showcase.InputOTPWithLabel(),

		// Modal
		"out/showcase/modal_default.html": showcase.ModalDefault(),

		// Pagination
		"out/showcase/pagination_default.html":     showcase.PaginationDefault(),
		"out/showcase/pagination_with_helper.html": showcase.PaginationWithHelper(),

		// Popover
		"out/showcase/popover_default.html":   showcase.PopoverDefault(),
		"out/showcase/popover_positions.html": showcase.PopoverPositions(),
		"out/showcase/popover_triggers.html":  showcase.PopoverTriggers(),

		// Progress
		"out/showcase/progress_colors.html":  showcase.ProgressVariants(),
		"out/showcase/progress_default.html": showcase.ProgressDefault(),
		"out/showcase/progress_sizes.html":   showcase.ProgressSizes(),

		// Radio
		"out/showcase/radio_card_default.html": showcase.RadioCardDefault(),
		"out/showcase/radio_checked.html":      showcase.RadioChecked(),
		"out/showcase/radio_default.html":      showcase.RadioDefault(),
		"out/showcase/radio_disabled.html":     showcase.RadioDisabled(),
		"out/showcase/radio_form.html":         showcase.RadioForm(),
		"out/showcase/radio_with_label.html":   showcase.RadioWithLabel(),

		// Rating
		"out/showcase/rating_default.html":    showcase.RatingDefault(),
		"out/showcase/rating_form.html":       showcase.RatingForm(),
		"out/showcase/rating_max_values.html": showcase.RatingMaxValues(),
		"out/showcase/rating_precision.html":  showcase.RatingPrecision(),
		"out/showcase/rating_styles.html":     showcase.RatingStyles(),
		"out/showcase/rating_with_label.html": showcase.RatingWithLabel(),

		// Select Box
		"out/showcase/select_box_default.html":    selectbox.SelectBoxDefault(),
		"out/showcase/select_box_disabled.html":   selectbox.SelectBoxDisabled(),
		"out/showcase/select_box_form.html":       selectbox.SelectBoxForm(),
		"out/showcase/select_box_with_label.html": selectbox.SelectBoxWithLabel(),

		// Separator
		"out/showcase/separator_decorated.html": showcase.SeparatorDecorated(),
		"out/showcase/separator_default.html":   showcase.SeparatorDefault(),
		"out/showcase/separator_label.html":     showcase.SeparatorLabel(),
		"out/showcase/separator_vertical.html":  showcase.SeparatorVertical(),

		// Skeleton
		"out/showcase/skeleton_card.html":      showcase.SkeletonCard(),
		"out/showcase/skeleton_dashboard.html": showcase.SkeletonDashboard(),
		"out/showcase/skeleton_default.html":   showcase.SkeletonDefault(),
		"out/showcase/skeleton_profile.html":   showcase.SkeletonProfile(),

		// Slider
		"out/showcase/slider_default.html":        showcase.SliderDefault(),
		"out/showcase/slider_disabled.html":       showcase.SliderDisabled(),
		"out/showcase/slider_external_value.html": showcase.SliderExternalValue(),
		"out/showcase/slider_steps.html":          showcase.SliderSteps(),
		"out/showcase/slider_value.html":          showcase.SliderValue(),

		// Spinner
		"out/showcase/spinner_colors.html":    showcase.SpinnerColors(),
		"out/showcase/spinner_default.html":   showcase.SpinnerDefault(),
		"out/showcase/spinner_in_button.html": showcase.SpinnerInButton(),
		"out/showcase/spinner_sizes.html":     showcase.SpinnerSizes(),

		// Table
		"out/showcase/table.html": showcase.Table(),

		// Tabs
		"out/showcase/tabs_default.html": showcase.TabsDefault(),

		// Tags Input
		"out/showcase/tags_input_default.html":    showcase.TagsInputDefault(),
		"out/showcase/tags_input_disabled.html":   showcase.TagsInputDisabled(),
		"out/showcase/tags_input_form.html":       showcase.TagsInputForm(),
		"out/showcase/tags_input_with_label.html": showcase.TagsInputWithLabel(),

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
		"out/showcase/time_picker_selected_time.html":      showcase.TimePickerSelectedTime(),

		// Toast
		"out/showcase/toast_default.html":    showcase.ToastDefault(),
		"out/showcase/toast_playground.html": showcase.ToastPlayground(),

		// Toggle
		"out/showcase/toggle_checked.html":    showcase.ToggleChecked(),
		"out/showcase/toggle_default.html":    showcase.ToggleDefault(),
		"out/showcase/toggle_disabled.html":   showcase.ToggleDisabled(),
		"out/showcase/toggle_form.html":       showcase.ToggleForm(),
		"out/showcase/toggle_with_label.html": showcase.ToggleWithLabel(),

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
