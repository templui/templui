package contextmenu

import (
	"bytes"
	"context"
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

func TestNativeMenuItemsFillTheirRows(t *testing.T) {
	for name, classes := range map[string]string{
		"item":       itemClasses(false),
		"check item": checkItemClasses("cn-context-menu-checkbox-item", false),
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

func TestClientRequestsCancelableRootAndItemChanges(t *testing.T) {
	source, err := os.ReadFile("contextmenu.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{
		`new CustomEvent("contextmenu-open-change"`,
		`new CustomEvent("contextmenu-sub-open-change"`,
		`new CustomEvent("contextmenu-checked-change"`,
		`new CustomEvent("contextmenu-value-change"`,
		`cancelable: true`,
	} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
	if strings.Contains(js, `data-state`) {
		t.Fatal("context menu client still uses Radix data-state semantics")
	}
}

func TestSubControlledOpenOverridesDefaultOpen(t *testing.T) {
	open := false
	if initialSubOpen(SubProps{Open: &open, DefaultOpen: true}) {
		t.Fatal("controlled false must override submenu defaultOpen true")
	}

	source, err := os.ReadFile("contextmenu.templ")
	if err != nil {
		t.Fatal(err)
	}
	templ := string(source)
	for _, want := range []string{`data-slot="context-menu-sub"`, `data-open?={ initialSubOpen(p) }`} {
		if !strings.Contains(templ, want) {
			t.Fatalf("context submenu template is missing %q", want)
		}
	}
}
