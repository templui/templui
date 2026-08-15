package sidebar12

import (
	"bytes"
	"context"
	"regexp"
	"strings"
	"testing"
)

func TestDatePickerMatchesUpstreamCalendarConfiguration(t *testing.T) {
	var output bytes.Buffer
	if err := DatePicker().Render(context.Background(), &output); err != nil {
		t.Fatal(err)
	}
	html := output.String()
	for _, want := range []string{
		`data-tui-calendar-mode="single"`,
		`bg-transparent [--cell-size:2.1rem]`,
		`data-tui-calendar-month-select`,
		`data-tui-calendar-year-select`,
	} {
		if !strings.Contains(html, want) {
			t.Fatalf("rendered date picker is missing %q: %s", want, html)
		}
	}
	if !regexp.MustCompile(`data-tui-calendar-selected="[0-9]{4}-[0-9]{2}-12"`).MatchString(html) {
		t.Fatalf("date picker must select day 12: %s", html)
	}
}

func TestUserMenuPrefersBottomOnMobile(t *testing.T) {
	var output bytes.Buffer
	if err := NavUser(User{Name: "Axel", Email: "a@example.com"}).Render(context.Background(), &output); err != nil {
		t.Fatal(err)
	}
	html := output.String()
	for _, want := range []string{
		`data-tui-dropdownmenu-side="right"`,
		`data-tui-dropdownmenu-mobile-side="bottom"`,
	} {
		if !strings.Contains(html, want) {
			t.Fatalf("rendered user menu is missing %q: %s", want, html)
		}
	}
}
