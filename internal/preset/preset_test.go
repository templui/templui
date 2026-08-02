// Ported from packages/shadcn/src/preset/preset.test.ts plus golden decodes
// verified against the vendored JS codec (assets/js/preset.js) and the live
// ui.shadcn.com/init output.
package preset

import "testing"

func TestPresetBases(t *testing.T) {
	want := []string{"radix", "base", "aria"}
	for i, b := range want {
		if Bases[i] != b {
			t.Fatalf("Bases[%d] = %q, want %q", i, Bases[i], b)
		}
	}
	if !IsPresetBase("aria") {
		t.Error("IsPresetBase(aria) = false")
	}
	if code := EncodePreset(Config{}); code[0] != 'b' {
		t.Errorf("EncodePreset({}) = %q, want b prefix", code)
	}
}

func TestParsePresetStyle(t *testing.T) {
	cases := []struct{ in, base, style string }{
		{"aria-nova", "aria", "nova"},
		{"base-vega", "base", "vega"},
		{"new-york", "", "new-york"},
		{"", "", ""},
	}
	for _, c := range cases {
		base, style := ParsePresetStyle(c.in)
		if base != c.base || style != c.style {
			t.Errorf("ParsePresetStyle(%q) = (%q, %q), want (%q, %q)", c.in, base, style, c.base, c.style)
		}
	}
}

func TestBase62(t *testing.T) {
	for _, n := range []uint64{0, 1, 61, 62, 100, 1000, 8388607} {
		if got := FromBase62(ToBase62(n)); got != int64(n) {
			t.Errorf("round-trip %d = %d", n, got)
		}
	}
	if ToBase62(0) != "0" {
		t.Errorf("ToBase62(0) = %q", ToBase62(0))
	}
	if FromBase62("!@#") != -1 {
		t.Errorf("FromBase62(invalid) = %d, want -1", FromBase62("!@#"))
	}
}

func TestEncodeDecodeRoundTrip(t *testing.T) {
	if code := EncodePreset(DefaultConfig()); code != "b0" {
		t.Errorf("EncodePreset(default) = %q, want b0", code)
	}

	decoded, ok := DecodePreset(EncodePreset(DefaultConfig()))
	if !ok || decoded != DefaultConfig() {
		t.Errorf("default round-trip = %+v, %v", decoded, ok)
	}

	custom := Config{
		Style:       "lyra",
		BaseColor:   "zinc",
		Theme:       "blue",
		ChartColor:  "emerald",
		IconLibrary: "tabler",
		Font:        "jetbrains-mono",
		FontHeading: "playfair-display",
		Radius:      "large",
		MenuAccent:  "bold",
		MenuColor:   "inverted",
	}
	code := EncodePreset(custom)
	if len(code) > 10 {
		t.Errorf("code %q longer than 10 chars", code)
	}
	decoded, ok = DecodePreset(code)
	if !ok || decoded != custom {
		t.Errorf("custom round-trip via %q = %+v", code, decoded)
	}

	// Partial config fills defaults.
	decoded, ok = DecodePreset(EncodePreset(Config{Style: "lyra"}))
	if !ok || decoded.Style != "lyra" || decoded.Theme != DefaultConfig().Theme {
		t.Errorf("partial round-trip = %+v", decoded)
	}
}

func TestRoundTripAllValues(t *testing.T) {
	for _, style := range Styles {
		if d, _ := DecodePreset(EncodePreset(Config{Style: style})); d.Style != style {
			t.Errorf("style %q round-trip = %q", style, d.Style)
		}
	}
	for _, theme := range Themes {
		if d, _ := DecodePreset(EncodePreset(Config{Theme: theme})); d.Theme != theme {
			t.Errorf("theme %q round-trip = %q", theme, d.Theme)
		}
	}
	for _, font := range Fonts {
		if d, _ := DecodePreset(EncodePreset(Config{Font: font})); d.Font != font {
			t.Errorf("font %q round-trip = %q", font, d.Font)
		}
	}
	for _, fh := range FontHeadings {
		if d, _ := DecodePreset(EncodePreset(Config{FontHeading: fh})); d.FontHeading != fh {
			t.Errorf("fontHeading %q round-trip = %q", fh, d.FontHeading)
		}
	}
	for _, lib := range IconLibraries {
		if d, _ := DecodePreset(EncodePreset(Config{IconLibrary: lib})); d.IconLibrary != lib {
			t.Errorf("iconLibrary %q round-trip = %q", lib, d.IconLibrary)
		}
	}
	for _, radius := range Radii {
		if d, _ := DecodePreset(EncodePreset(Config{Radius: radius})); d.Radius != radius {
			t.Errorf("radius %q round-trip = %q", radius, d.Radius)
		}
	}
	for _, bc := range BaseColors {
		if d, _ := DecodePreset(EncodePreset(Config{BaseColor: bc})); d.BaseColor != bc {
			t.Errorf("baseColor %q round-trip = %q", bc, d.BaseColor)
		}
	}
	for _, cc := range ChartColors {
		if d, _ := DecodePreset(EncodePreset(Config{ChartColor: cc})); d.ChartColor != cc {
			t.Errorf("chartColor %q round-trip = %q", cc, d.ChartColor)
		}
	}
	for _, ma := range MenuAccents {
		for _, mc := range MenuColors {
			d, _ := DecodePreset(EncodePreset(Config{MenuAccent: ma, MenuColor: mc}))
			if d.MenuAccent != ma || d.MenuColor != mc {
				t.Errorf("menu %q/%q round-trip = %q/%q", ma, mc, d.MenuAccent, d.MenuColor)
			}
		}
	}
}

// Golden decodes, verified byte for byte against the vendored JS codec.
func TestGoldenDecodes(t *testing.T) {
	cases := []struct {
		code string
		want Config
	}{
		{"b0", Config{
			Style: "nova", BaseColor: "neutral", Theme: "neutral", ChartColor: "neutral",
			IconLibrary: "lucide", Font: "inter", FontHeading: "inherit",
			Radius: "default", MenuAccent: "subtle", MenuColor: "default",
		}},
		{"bIkeymG", Config{
			Style: "vega", BaseColor: "neutral", Theme: "neutral", ChartColor: "neutral",
			IconLibrary: "lucide", Font: "inter", FontHeading: "inherit",
			Radius: "default", MenuAccent: "subtle", MenuColor: "default",
		}},
		{"b2D0wqNxT", Config{
			Style: "luma", BaseColor: "neutral", Theme: "blue", ChartColor: "emerald",
			IconLibrary: "hugeicons", Font: "geist", FontHeading: "inherit",
			Radius: "default", MenuAccent: "subtle", MenuColor: "inverted-translucent",
		}},
		// v1 code: no chartColor, fontHeading forced to inherit.
		{"a0", Config{
			Style: "nova", BaseColor: "neutral", Theme: "neutral", ChartColor: "",
			IconLibrary: "lucide", Font: "inter", FontHeading: "inherit",
			Radius: "default", MenuAccent: "subtle", MenuColor: "default",
		}},
	}
	for _, c := range cases {
		got, ok := DecodePreset(c.code)
		if !ok {
			t.Errorf("DecodePreset(%q) failed", c.code)
			continue
		}
		if got != c.want {
			t.Errorf("DecodePreset(%q) =\n%+v, want\n%+v", c.code, got, c.want)
		}
	}
}

func TestDecodeEdgeCases(t *testing.T) {
	for _, code := range []string{"", "A", "c123", "A!@#", "b!!"} {
		if _, ok := DecodePreset(code); ok {
			t.Errorf("DecodePreset(%q) succeeded, want failure", code)
		}
	}
}

func TestIsPresetCode(t *testing.T) {
	trues := []string{"a0", "b0", EncodePreset(DefaultConfig())}
	falses := []string{"", "c0", "https://ui.shadcn.com/init?foo=bar", "radix-nova", "A1234567890", "A!@#"}
	for _, v := range trues {
		if !IsPresetCode(v) {
			t.Errorf("IsPresetCode(%q) = false", v)
		}
	}
	for _, v := range falses {
		if IsPresetCode(v) {
			t.Errorf("IsPresetCode(%q) = true", v)
		}
	}
}

func TestIsValidPreset(t *testing.T) {
	if !IsValidPreset(EncodePreset(DefaultConfig())) {
		t.Error("IsValidPreset(default code) = false")
	}
	if IsValidPreset("") || IsValidPreset("c123") {
		t.Error("IsValidPreset(invalid) = true")
	}
}

func TestGenerateRandomPreset(t *testing.T) {
	for range 20 {
		code := GenerateRandomPreset()
		if !IsPresetCode(code) || !IsValidPreset(code) {
			t.Fatalf("random code %q invalid", code)
		}
		decoded, ok := DecodePreset(code)
		if !ok {
			t.Fatalf("random code %q failed decode", code)
		}
		if re := EncodePreset(decoded); re != code {
			t.Fatalf("random code %q re-encoded to %q", code, re)
		}
	}
}
