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

	var output bytes.Buffer
	if err := Sub(SubProps{Open: &open, DefaultOpen: true}).Render(context.Background(), &output); err != nil {
		t.Fatal(err)
	}
	html := output.String()
	if !strings.Contains(html, `data-tui-contextmenu-sub-open="false"`) ||
		!strings.Contains(html, `data-tui-contextmenu-sub-controlled`) {
		t.Fatalf("rendered controlled submenu is missing state markers: %s", html)
	}
}
