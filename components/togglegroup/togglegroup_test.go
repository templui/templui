package togglegroup

import (
	"os"
	"strings"
	"testing"
)

func TestTemplateHasNoPrivateControlMarker(t *testing.T) {
	source, err := os.ReadFile("togglegroup.templ")
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(source), "data-toggle-group-controlled") {
		t.Fatal("toggle group state ownership must not leak into private DOM markers")
	}
}

func TestClientRequestsCancelableGroupValueChanges(t *testing.T) {
	source, err := os.ReadFile("../toggle/toggle.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{
		`new CustomEvent("toggle-group-value-change"`,
		`cancelable: true`,
		`detail: { value: groupValue }`,
		`attributes: ["data-pressed"]`,
	} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
}
