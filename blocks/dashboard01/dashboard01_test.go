package dashboard01

import (
	"bytes"
	"context"
	"os"
	"strings"
	"testing"
)

func TestInteractiveBaseBlockPendantsAreRendered(t *testing.T) {
	dataTableSource, err := os.ReadFile("data_table.templ")
	if err != nil {
		t.Fatal(err)
	}
	dataTable := string(dataTableSource)
	for _, want := range []string{
		"data-dashboard01-sortable",
		"data-dashboard01-drag-handle",
		"data-dashboard01-save={ item.Header }",
		"window.shadcnTempl?.toast?.promise",
		"data-dashboard01-drawer-trigger",
		"mobile ? \"down\" : \"right\"",
	} {
		if !strings.Contains(dataTable, want) {
			t.Errorf("data table source is missing %q", want)
		}
	}

	var out bytes.Buffer
	out.Reset()
	if err := dataTableDrawerBody(Data[0]).Render(context.Background(), &out); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out.String(), "class=\"hidden md:contents\"") {
		t.Error("rendered drawer body does not hide desktop-only details on mobile")
	}

	chartSource, err := os.ReadFile("chart_area_interactive.templ")
	if err != nil {
		t.Fatal(err)
	}
	chart := string(chartSource)
	for _, want := range []string{
		"data-dashboard01-chart-range-card",
		"window.matchMedia(\"(max-width: 767px)\")",
		"setRange(card, \"7d\")",
	} {
		if !strings.Contains(chart, want) {
			t.Errorf("chart source is missing %q", want)
		}
	}
}
