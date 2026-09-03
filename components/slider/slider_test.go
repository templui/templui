package slider

import (
	"os"
	"strings"
	"testing"
)

func TestTemplateHasNoPrivateControlMarker(t *testing.T) {
	source, err := os.ReadFile("slider.templ")
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(source), "data-slider-controlled") {
		t.Fatal("slider state ownership must not leak into private DOM markers")
	}
}

func TestClientRequestsCancelableValueChanges(t *testing.T) {
	source, err := os.ReadFile("slider.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{`new CustomEvent("slider-change"`, `cancelable: true`, `attributes: ["aria-valuenow", "aria-valuemin", "aria-valuemax"]`} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
}
