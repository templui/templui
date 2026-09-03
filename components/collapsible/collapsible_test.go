package collapsible

import (
	"os"
	"strings"
	"testing"
)

func TestControlledOpenOverridesDefaultOpen(t *testing.T) {
	open := false
	if initialOpen(Props{Open: &open, DefaultOpen: true}) {
		t.Fatal("explicit false must override DefaultOpen")
	}
}

func TestClientRequestsCancelableOpenChanges(t *testing.T) {
	source, err := os.ReadFile("collapsible.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{`new CustomEvent("collapsible-open-change"`, `cancelable: true`, `attributes: ["data-open"]`} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
}
