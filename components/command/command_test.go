package command

import (
	"os"
	"strings"
	"testing"
)

func TestDialogForwardsOpenStateToDialogRoot(t *testing.T) {
	source, err := os.ReadFile("command.templ")
	if err != nil {
		t.Fatal(err)
	}
	templ := string(source)
	for _, want := range []string{"Open:               p.Open", "DefaultOpen:        p.DefaultOpen"} {
		if !strings.Contains(templ, want) {
			t.Fatalf("command dialog does not forward %q", want)
		}
	}
	if strings.Contains(templ, "data-dialog-controlled") {
		t.Fatal("command dialog leaks private state ownership into HTML")
	}
}
