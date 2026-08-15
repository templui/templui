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
	ctx := context.WithValue(context.Background(), stateKey, ctxState{id: "menu", initialOpen: true, controlled: true})
	var output bytes.Buffer
	if err := Content(ContentProps{
		Side:        SideRight,
		Align:       AlignStart,
		MobileSide:  SideBottom,
		MobileAlign: AlignEnd,
	}).Render(ctx, &output); err != nil {
		t.Fatal(err)
	}

	html := output.String()
	for _, want := range []string{
		`id="menu"`,
		`data-tui-dropdownmenu-side="right"`,
		`data-tui-dropdownmenu-mobile-side="bottom"`,
		`data-tui-dropdownmenu-mobile-align="end"`,
		`data-tui-dropdownmenu-initial-open="true"`,
		`data-tui-dropdownmenu-controlled`,
	} {
		if !strings.Contains(html, want) {
			t.Fatalf("rendered menu is missing %q: %s", want, html)
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
		`data-tui-dropdownmenu-mobile-side`,
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

	var output bytes.Buffer
	if err := Sub(SubProps{Open: &open, DefaultOpen: true}).Render(context.Background(), &output); err != nil {
		t.Fatal(err)
	}
	html := output.String()
	if !strings.Contains(html, `data-tui-dropdownmenu-sub-open="false"`) ||
		!strings.Contains(html, `data-tui-dropdownmenu-sub-controlled`) {
		t.Fatalf("rendered controlled submenu is missing state markers: %s", html)
	}
}
