package popover

import (
	"os"
	"strings"
	"testing"
)

func TestContentCarriesDeclarativeInitialOpenState(t *testing.T) {
	source, err := os.ReadFile("popover.templ")
	if err != nil {
		t.Fatal(err)
	}
	templ := string(source)
	for _, want := range []string{
		`data-slot="popover-positioner"`,
		`data-open?={ s.initialOpen }`,
		`data-closed?={ !s.initialOpen }`,
		`hidden`,
	} {
		if !strings.Contains(templ, want) {
			t.Fatalf("popover template is missing %q", want)
		}
	}
}

func TestControlledOpenOverridesDefaultOpen(t *testing.T) {
	closed := false
	if initialOpen(Props{Open: &closed, DefaultOpen: true}) {
		t.Fatal("controlled false must override defaultOpen true")
	}

	opened := true
	if !initialOpen(Props{Open: &opened}) {
		t.Fatal("controlled true must open the popover")
	}
}

func TestClientConsumesInitialOpenAfterPortalMount(t *testing.T) {
	source, err := os.ReadFile("popover.js")
	if err != nil {
		t.Fatal(err)
	}

	js := string(source)
	for _, want := range []string{
		`liftTemplates();`,
		`content.hasAttribute("data-open")`,
		`attributes: ["data-open"]`,
		`open(content);`,
		`FloatingUIDOM.autoUpdate(trigger, content, update`,
		`layoutShift: typeof IntersectionObserver !== "undefined"`,
	} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
}
