package sidebar05

import (
	"bytes"
	"context"
	"strings"
	"testing"
)

func TestCollapsibleMenuIconsFollowBaseUIExpandedState(t *testing.T) {
	var output bytes.Buffer
	if err := AppSidebar().Render(context.Background(), &output); err != nil {
		t.Fatal(err)
	}

	html := output.String()
	for _, want := range []string{
		`group-aria-expanded/menu-button:hidden`,
		`hidden group-aria-expanded/menu-button:block`,
		`aria-expanded="true"`,
		`aria-expanded="false"`,
	} {
		if !strings.Contains(html, want) {
			t.Fatalf("rendered sidebar is missing %q", want)
		}
	}
	if strings.Contains(html, `group-data-[state=`) {
		t.Fatal("rendered sidebar still uses Radix data-state selectors")
	}
}
