package sidebar10

import (
	"os"
	"strings"
	"testing"
)

func TestActionsPopoverIsLinkedAndInitiallyOpen(t *testing.T) {
	source, err := os.ReadFile("nav_actions.templ")
	if err != nil {
		t.Fatal(err)
	}

	templSource := string(source)
	for _, want := range []string{
		`ID:          "sidebar10-actions-popover"`,
		`DefaultOpen: true`,
		`Attributes: popover.Trigger(ctx)`,
	} {
		if !strings.Contains(templSource, want) {
			t.Fatalf("actions popover source is missing %q", want)
		}
	}
}
