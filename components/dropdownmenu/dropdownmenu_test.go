package dropdownmenu

import (
	"bytes"
	"context"
	"os"
	"strings"
	"testing"
)

func TestNativeMenuItemsFillTheirRows(t *testing.T) {
	for name, classes := range map[string]string{
		"item":       itemClasses(false),
		"check item": checkItemClasses("cn-dropdown-menu-checkbox-item", false),
	} {
		if !strings.Contains(classes, "w-full") || !strings.Contains(classes, "text-left") {
			t.Fatalf("%s classes must preserve Base UI row layout: %q", name, classes)
		}
	}

	var output bytes.Buffer
	if err := SubTrigger().Render(context.Background(), &output); err != nil {
		t.Fatal(err)
	}
	if html := output.String(); !strings.Contains(html, "w-full") || !strings.Contains(html, "text-left") {
		t.Fatalf("submenu trigger must preserve Base UI row layout: %s", html)
	}
}

func TestContentCarriesStateAndResponsivePlacement(t *testing.T) {
	source, err := os.ReadFile("dropdownmenu.templ")
	if err != nil {
		t.Fatal(err)
	}
	templ := string(source)
	for _, want := range []string{
		`data-slot="dropdown-menu-positioner"`,
		`data-side={ string(p.Side) }`,
		`data-mobile-side={ string(p.MobileSide) }`,
		`data-mobile-align={ string(p.MobileAlign) }`,
		`data-open?={ s.initialOpen }`,
	} {
		if !strings.Contains(templ, want) {
			t.Fatalf("menu template is missing %q", want)
		}
	}
}

func TestClientUsesResponsivePreferenceAndCollisionAvoidance(t *testing.T) {
	source, err := os.ReadFile("dropdownmenu.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{
		`matchMedia("(max-width: 767px)")`,
		`data-mobile-side`,
		`flip({ padding: COLLISION_PADDING })`,
		`shift({ padding: COLLISION_PADDING })`,
		`FloatingUIDOM.autoUpdate(trigger, content, update`,
		`layoutShift: typeof IntersectionObserver !== "undefined"`,
		`new CustomEvent("dropdownmenu-open-change"`,
		`new CustomEvent("dropdownmenu-sub-open-change"`,
		`new CustomEvent("dropdownmenu-checked-change"`,
		`new CustomEvent("dropdownmenu-value-change"`,
		`cancelable: true`,
	} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
	if strings.Contains(js, `data-state`) {
		t.Fatal("dropdown menu client still uses Radix data-state semantics")
	}
}

func TestSubControlledOpenOverridesDefaultOpen(t *testing.T) {
	open := false
	if initialSubOpen(SubProps{Open: &open, DefaultOpen: true}) {
		t.Fatal("controlled false must override submenu defaultOpen true")
	}

	source, err := os.ReadFile("dropdownmenu.templ")
	if err != nil {
		t.Fatal(err)
	}
	templ := string(source)
	for _, want := range []string{`data-slot="dropdown-menu-sub"`, `data-open?={ initialSubOpen(p) }`} {
		if !strings.Contains(templ, want) {
			t.Fatalf("dropdown submenu template is missing %q", want)
		}
	}
}
