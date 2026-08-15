package hovercard

import (
	"os"
	"strings"
	"testing"
)

func TestControlledOpenOverridesDefaultOpen(t *testing.T) {
	open := false
	if initialOpen(Props{Open: &open, DefaultOpen: true}) {
		t.Fatal("controlled false must override defaultOpen true")
	}
}

func TestClientRequestsCancelableOpenChanges(t *testing.T) {
	source, err := os.ReadFile("hovercard.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{
		`new CustomEvent("hovercard-open-change"`,
		`cancelable: true`,
		`data-tui-hovercard-controlled`,
		`FloatingUIDOM.autoUpdate(trigger, content, update`,
		`layoutShift: typeof IntersectionObserver !== "undefined"`,
	} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
	if strings.Contains(js, `data-state`) {
		t.Fatal("hover card client still uses Radix data-state semantics")
	}
}
