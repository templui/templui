package selectcomp

import (
	"bytes"
	"context"
	"os"
	"strings"
	"testing"
)

func TestControlledStateOverridesDefaults(t *testing.T) {
	value := ""
	open := false
	p := Props{Value: &value, DefaultValue: "banana", Open: &open, DefaultOpen: true}
	if got := initialValue(p); got != "" {
		t.Fatalf("controlled empty value must override default value, got %q", got)
	}
	if initialOpen(p) {
		t.Fatal("controlled false open state must override defaultOpen true")
	}
}

func TestItemSelectionComesOnlyFromRootValue(t *testing.T) {
	ctx := context.WithValue(context.Background(), stateKey, ctxState{value: "banana"})
	var output bytes.Buffer
	if err := Item(ItemProps{Value: "banana"}).Render(ctx, &output); err != nil {
		t.Fatal(err)
	}
	html := output.String()
	for _, want := range []string{`data-selected`, `aria-selected="true"`} {
		if !strings.Contains(html, want) {
			t.Fatalf("rendered item is missing %q: %s", want, html)
		}
	}
}

func TestClientRequestsCancelableValueAndOpenChanges(t *testing.T) {
	source, err := os.ReadFile("select.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{
		`new CustomEvent("select-change"`,
		`new CustomEvent("select-open-change"`,
		`cancelable: true`,
		`data-tui-select-value-controlled`,
		`data-tui-select-open-controlled`,
		`FloatingUIDOM.autoUpdate(trigger, content, update`,
		`layoutShift: typeof IntersectionObserver !== "undefined"`,
		`const SELECTED_DELAY = 400`,
		`item._tuiAllowMouseSelection = true`,
		`item._tuiPointerType === "touch"`,
		`document.addEventListener("mouseup"`,
		`item.hasAttribute("data-selected")`,
		`requestOpenChange(content, false)`,
		`requestOpenChange(content, true)`,
	} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
}
