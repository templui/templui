package pages

import (
	"os"
	"regexp"
	"strings"
	"testing"
)

func readCreateInteractionSource(t *testing.T, path string) string {
	t.Helper()
	source, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(source)
}

func TestCreateCodeTabsUseControlledToggleGroupContract(t *testing.T) {
	templateSource := readCreateInteractionSource(t, "create.templ")
	clientSource := readCreateInteractionSource(t, "../../../assets/js/create.js")

	if !regexp.MustCompile(`Value:\s+\[\]string\{"new-project"\}`).MatchString(templateSource) {
		t.Fatal("Get Code tabs must render as a controlled ToggleGroup")
	}
	if !strings.Contains(templateSource, "data-pressed:bg-neutral-700/70") {
		t.Fatal("Get Code tabs must use Base UI's data-pressed state")
	}
	for _, want := range []string{
		`document.addEventListener("toggle-group-value-change"`,
		`activeTab = e.detail.value[0] || "new-project"`,
		`toggle.toggleAttribute("data-pressed", on)`,
	} {
		if !strings.Contains(clientSource, want) {
			t.Fatalf("Get Code tab behavior is missing %q", want)
		}
	}
	if strings.Contains(clientSource, `data-state`) {
		t.Fatal("create client still uses Radix data-state semantics for Base UI toggles")
	}
}

func TestCreatePreviewCardsUseControlledToggleGroupContract(t *testing.T) {
	source := readCreateInteractionSource(t, "create_preview_cards.templ")

	for _, value := range []string{"cooking", "half"} {
		pattern := regexp.MustCompile(`Value:\s+\[\]string\{"` + value + `"\}`)
		if !pattern.MatchString(source) {
			t.Fatalf("preview ToggleGroup %q must be controlled", value)
		}
	}
	if strings.Count(source, `document.addEventListener("toggle-group-value-change"`) < 2 {
		t.Fatal("controlled preview ToggleGroups must consume group value changes")
	}
	if strings.Contains(source, `setAttribute("data-state"`) {
		t.Fatal("create preview cards still write Radix data-state semantics")
	}
}
