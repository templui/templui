package accordion

import (
	"os"
	"strings"
	"testing"
)

func TestRootUsesPublicItemStateOnly(t *testing.T) {
	source, err := os.ReadFile("accordion.templ")
	if err != nil {
		t.Fatal(err)
	}
	templ := string(source)
	for _, want := range []string{`data-slot="accordion"`, `data-slot="accordion-item"`, `data-open?={ open }`} {
		if !strings.Contains(templ, want) {
			t.Fatalf("accordion template is missing %q", want)
		}
	}
	if strings.Contains(templ, "data-accordion-controlled") {
		t.Fatal("accordion template leaks private state ownership into HTML")
	}
}

func TestClientRequestsCancelableValueChanges(t *testing.T) {
	source, err := os.ReadFile("accordion.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{`new CustomEvent("accordion-value-change"`, `cancelable: true`, `attributes: ["data-open"]`} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
}
