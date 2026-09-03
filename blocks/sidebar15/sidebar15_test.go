package sidebar15

import (
	"os"
	"strings"
	"testing"
)

func TestDatePickerMatchesUpstreamCalendarConfiguration(t *testing.T) {
	source, err := os.ReadFile("date_picker.templ")
	if err != nil {
		t.Fatal(err)
	}
	templSource := string(source)
	for _, want := range []string{
		`Mode:          calendar.ModeSingle`,
		`CaptionLayout: calendar.CaptionLayoutDropdown`,
		`Class:         "bg-transparent [--cell-size:2.1rem]"`,
		`time.Date(now.Year(), now.Month(), 12`,
	} {
		if !strings.Contains(templSource, want) {
			t.Fatalf("date picker source is missing %q", want)
		}
	}
}
