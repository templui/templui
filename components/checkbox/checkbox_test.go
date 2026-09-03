package checkbox

import (
	"os"
	"strings"
	"testing"
)

func TestControlledCheckedOverridesDefaultChecked(t *testing.T) {
	checked := false
	if initialChecked(Props{Checked: &checked, DefaultChecked: true}) {
		t.Fatal("explicit false must override DefaultChecked")
	}
}

func TestClientRequestsCancelableCheckedChanges(t *testing.T) {
	source, err := os.ReadFile("checkbox.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{`new CustomEvent("checkbox-change"`, `cancelable: true`, `attributes: ["data-checked", "data-indeterminate"]`} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
}
