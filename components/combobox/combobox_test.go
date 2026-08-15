package combobox

import (
	"os"
	"strings"
	"testing"
)

func TestControlledStateOverridesDefaults(t *testing.T) {
	value := ""
	open := false
	p := Props{Value: &value, DefaultValue: "templ", Open: &open, DefaultOpen: true}
	if got := initialValue(p); got != "" {
		t.Fatalf("controlled empty value must override default value, got %q", got)
	}
	if initialOpen(p) {
		t.Fatal("controlled false open state must override defaultOpen true")
	}
}

func TestClientRequestsCancelableValueAndOpenChanges(t *testing.T) {
	source, err := os.ReadFile("combobox.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{
		`new CustomEvent("combobox-change"`,
		`new CustomEvent("combobox-open-change"`,
		`cancelable: true`,
		`data-tui-combobox-value-controlled`,
		`data-tui-combobox-open-controlled`,
		`FloatingUIDOM.autoUpdate(anchor, content, update`,
		`layoutShift: typeof IntersectionObserver !== "undefined"`,
	} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
	if strings.Contains(js, `data-state`) {
		t.Fatal("combobox client still uses Radix data-state semantics")
	}
}
