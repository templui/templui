package utils

import (
	"context"
	"io"

	"github.com/a-h/templ"
)

type Script string

const (
	ScriptAvatar      Script = "avatar"
	ScriptCalendar    Script = "calendar"
	ScriptCarousel    Script = "carousel"
	ScriptChart       Script = "chart"
	ScriptCheckbox    Script = "checkbox"
	ScriptCollapsible Script = "collapsible"
	ScriptCopyButton  Script = "copybutton"
	ScriptDatePicker  Script = "datepicker"
	ScriptDialog      Script = "dialog"
	ScriptDropdown    Script = "dropdown"
	ScriptInput       Script = "input"
	ScriptInputOTP    Script = "inputotp"
	ScriptLabel       Script = "label"
	ScriptPopover     Script = "popover"
	ScriptProgress    Script = "progress"
	ScriptRating      Script = "rating"
	ScriptSelectBox   Script = "selectbox"
	ScriptSheet       Script = "sheet"
	ScriptSidebar     Script = "sidebar"
	ScriptSlider      Script = "slider"
	ScriptTabs        Script = "tabs"
	ScriptTagsInput   Script = "tagsinput"
	ScriptTextarea    Script = "textarea"
	ScriptTimePicker  Script = "timepicker"
	ScriptToast       Script = "toast"
	ScriptTooltip     Script = "tooltip"
)

var scriptDependencies = map[Script][]Script{
	ScriptDatePicker: {ScriptCalendar, ScriptPopover},
	ScriptDropdown:   {ScriptPopover},
	ScriptSelectBox:  {ScriptPopover},
	ScriptSheet:      {ScriptDialog},
	ScriptSidebar:    {ScriptSheet, ScriptTooltip},
	ScriptTagsInput:  {ScriptPopover},
	ScriptTimePicker: {ScriptPopover},
	ScriptTooltip:    {ScriptPopover},
}

func Scripts(scripts ...Script) templ.Component {
	resolved := resolveScripts(scripts...)

	return templ.ComponentFunc(func(ctx context.Context, w io.Writer) error {
		nonce := templ.GetNonce(ctx)

		for _, script := range resolved {
			if isVirtualScript(script) {
				continue
			}

			if _, err := io.WriteString(w, `<script defer`); err != nil {
				return err
			}
			if nonce != "" {
				if _, err := io.WriteString(w, ` nonce="`); err != nil {
					return err
				}
				if _, err := io.WriteString(w, templ.EscapeString(nonce)); err != nil {
					return err
				}
				if _, err := io.WriteString(w, `"`); err != nil {
					return err
				}
			}
			if _, err := io.WriteString(w, ` src="`); err != nil {
				return err
			}
			if _, err := io.WriteString(w, templ.EscapeString(componentScriptSrc(string(script)))); err != nil {
				return err
			}
			if _, err := io.WriteString(w, `"></script>`); err != nil {
				return err
			}
		}

		return nil
	})
}

func componentScriptSrc(component string) string {
	return ComponentScriptURL(component)
}

func isVirtualScript(script Script) bool {
	switch script {
	case ScriptSheet, ScriptTooltip:
		return true
	default:
		return false
	}
}

func resolveScripts(requested ...Script) []Script {
	resolved := make([]Script, 0, len(requested))
	seen := make(map[Script]bool, len(requested))

	var visit func(Script)
	visit = func(script Script) {
		if script == "" || seen[script] {
			return
		}
		seen[script] = true

		for _, dependency := range scriptDependencies[script] {
			visit(dependency)
		}

		if !isVirtualScript(script) {
			resolved = append(resolved, script)
		}
	}

	for _, script := range requested {
		visit(script)
	}

	return resolved
}
