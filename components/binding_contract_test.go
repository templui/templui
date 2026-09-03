package components

import (
	"os"
	"strings"
	"testing"
)

func TestStatefulComponentsExposeTwoWayDOMContracts(t *testing.T) {
	t.Parallel()

	contracts := []struct {
		path string
		want []string
	}{
		{"checkbox/checkbox.templ", []string{"InputAttributes templ.Attributes"}},
		{"checkbox/checkbox.js", []string{`new CustomEvent("checkbox-change"`, `lifecycle.watchProperty(`, `"checked"`, `attributes: ["data-checked", "data-indeterminate"]`}},
		{"switch/switch.templ", []string{"InputAttributes templ.Attributes"}},
		{"switch/switch.js", []string{`new CustomEvent("switch-change"`, `lifecycle.watchProperty(`, `"checked"`, `attributes: ["data-checked"]`}},
		{"radiogroup/radiogroup.templ", []string{"InputAttributes templ.Attributes"}},
		{"radiogroup/radiogroup.js", []string{`new CustomEvent(group ? "radio-group-value-change"`, `lifecycle.watchProperty(`, `"checked"`, `attributes: ["data-checked"]`}},
		{"tabs/tabs.js", []string{`new CustomEvent("tabs-value-change"`, `attributes: ["data-value"]`}},
		{"accordion/accordion.js", []string{`new CustomEvent("accordion-value-change"`, `attributes: ["data-open"]`}},
		{"collapsible/collapsible.js", []string{`new CustomEvent("collapsible-open-change"`, `attributes: ["data-open"]`}},
		{"toggle/toggle.js", []string{`new CustomEvent("toggle-change"`, `new CustomEvent("toggle-group-value-change"`, `attributes: ["data-pressed"]`}},
		{"select/select.templ", []string{"InputAttributes templ.Attributes", `data-slot="select-input"`, `data-value={ s.value }`}},
		{"select/select.js", []string{`new CustomEvent("select-change"`, `new Event("input", { bubbles: true })`, `watchProperty(input, "value"`, `attributes: ["data-value"]`}},
		{"combobox/combobox.js", []string{`new CustomEvent("combobox-change"`, `new Event("input", { bubbles: true })`, `watchProperty(input, "value"`, `attributes: ["data-selected"]`}},
		{"slider/slider.templ", []string{"InputAttributes templ.Attributes", `data-slot="slider-input"`}},
		{"slider/slider.js", []string{`new CustomEvent("slider-change"`, `new Event("input", { bubbles: true })`, `watchProperty(input, "value"`, `attributes: ["aria-valuenow", "aria-valuemin", "aria-valuemax"]`}},
		{"calendar/calendar.templ", []string{"InputAttributes    templ.Attributes", "EndInputAttributes templ.Attributes"}},
		{"calendar/calendar.js", []string{`new CustomEvent("calendar-change"`, `new Event("input", { bubbles: true })`, `watchProperty(input, "value"`, `attributes: ["data-selected", "data-range-end", "data-month"]`}},
		{"inputotp/inputotp.templ", []string{"InputAttributes templ.Attributes"}},
		{"inputotp/inputotp.js", []string{`watchProperty(input, "value"`, `attributes: ["data-value"]`}},
		{"runtime/runtime.js", []string{`function watchProperty(element, property, changed)`, `lifecycle: Object.freeze({ register, watchProperty })`}},
	}

	for _, contract := range contracts {
		contract := contract
		t.Run(contract.path, func(t *testing.T) {
			source, err := os.ReadFile(contract.path)
			if err != nil {
				t.Fatal(err)
			}
			for _, want := range contract.want {
				if !strings.Contains(string(source), want) {
					t.Errorf("missing two-way DOM contract %q", want)
				}
			}
		})
	}
}
