package radiogroup

import (
	"os"
	"strings"
	"testing"
)

func TestControlledValueOverridesDefaultValue(t *testing.T) {
	value := ""
	if got := initialValue(Props{Value: &value, DefaultValue: "monthly"}); got != "" {
		t.Fatalf("explicit empty value must override DefaultValue, got %q", got)
	}
}

func TestClientRequestsCancelableValueChanges(t *testing.T) {
	source, err := os.ReadFile("radiogroup.js")
	if err != nil {
		t.Fatal(err)
	}
	js := string(source)
	for _, want := range []string{`"radio-group-value-change"`, `cancelable: true`, `attributes: ["data-checked"]`} {
		if !strings.Contains(js, want) {
			t.Fatalf("client behavior is missing %q", want)
		}
	}
}
