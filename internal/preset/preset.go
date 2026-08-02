// Package preset is the 1:1 Go port of shadcn/preset
// (packages/shadcn/src/preset/preset.ts, shadcn@4.16.0), the pendant of the
// vendored browser codec in assets/js/preset.js. It bit-packs design system
// params into a single integer, then encodes as base62 with a version prefix
// character. Codes are interchangeable with shadcn: ui.shadcn.com/create URLs
// and `npx shadcn init --preset <code>` accept ours and vice versa.
//
// Rules for backward compat (from the source):
//  1. Never reorder existing value arrays, only append.
//  2. New fields must have their default at index 0.
//  3. Only append new fields to the end of the field list.
//  4. Stay under 53 bits total (JS safe integer limit).
package preset

import (
	"math/rand"
	"strings"
)

// Value arrays. Order matters for backward compat. Never reorder, only append.
var Bases = []string{"radix", "base", "aria"}

// IsPresetBase is the isPresetBase pendant.
func IsPresetBase(value string) bool {
	return contains(Bases, value)
}

// ParsePresetStyle is the parsePresetStyle pendant: splits a prefixed style
// name ("base-vega") into base and style; legacy names pass through with an
// empty base.
func ParsePresetStyle(style string) (base string, name string) {
	for _, b := range Bases {
		if strings.HasPrefix(style, b+"-") {
			return b, style[len(b)+1:]
		}
	}
	return "", style
}

var Styles = []string{
	"nova",
	"vega",
	"maia",
	"lyra",
	"mira",
	"luma",
	"sera",
	"rhea",
}

var BaseColors = []string{
	"neutral",
	"stone",
	"zinc",
	"gray",
	"mauve",
	"olive",
	"mist",
	"taupe",
}

var Themes = []string{
	"neutral",
	"stone",
	"zinc",
	"gray",
	"amber",
	"blue",
	"cyan",
	"emerald",
	"fuchsia",
	"green",
	"indigo",
	"lime",
	"orange",
	"pink",
	"purple",
	"red",
	"rose",
	"sky",
	"teal",
	"violet",
	"yellow",
	"mauve",
	"olive",
	"mist",
	"taupe",
}

var ChartColors = Themes

// V1ChartColorMap: before v2, base-color themes had colored chart palettes
// borrowed from these colored themes. Used by consumers to restore the
// original chart colors when decoding v1 presets.
var V1ChartColorMap = map[string]string{
	"neutral": "blue",
	"stone":   "lime",
	"zinc":    "amber",
	"mauve":   "emerald",
	"olive":   "violet",
	"mist":    "rose",
	"taupe":   "cyan",
}

var IconLibraries = []string{
	"lucide",
	"hugeicons",
	"tabler",
	"phosphor",
	"remixicon",
}

var Fonts = []string{
	"inter",
	"noto-sans",
	"nunito-sans",
	"figtree",
	"roboto",
	"raleway",
	"dm-sans",
	"public-sans",
	"outfit",
	"jetbrains-mono",
	"geist",
	"geist-mono",
	"lora",
	"merriweather",
	"playfair-display",
	"noto-serif",
	"roboto-slab",
	"oxanium",
	"manrope",
	"space-grotesk",
	"montserrat",
	"ibm-plex-sans",
	"source-sans-3",
	"instrument-sans",
	"eb-garamond",
	"instrument-serif",
}

var FontHeadings = append([]string{"inherit"}, Fonts...)

var Radii = []string{
	"default",
	"none",
	"small",
	"medium",
	"large",
}

var MenuAccents = []string{"subtle", "bold"}
var MenuColors = []string{
	"default",
	"inverted",
	"default-translucent",
	"inverted-translucent",
}

// Config is the PresetConfig pendant. An empty ChartColor means unset (the
// undefined chartColor of decoded v1 codes).
type Config struct {
	Style       string
	BaseColor   string
	Theme       string
	ChartColor  string
	IconLibrary string
	Font        string
	FontHeading string
	Radius      string
	MenuAccent  string
	MenuColor   string
}

type field struct {
	key    string
	values []string
	bits   uint
}

// V1 fields (version "a"): 40 bits. No chartColor.
var fieldsV1 = []field{
	{"menuColor", MenuColors, 3},
	{"menuAccent", MenuAccents, 3},
	{"radius", Radii, 4},
	{"font", Fonts, 6},
	{"iconLibrary", IconLibraries, 6},
	{"theme", Themes, 6},
	{"baseColor", BaseColors, 6},
	{"style", Styles, 6},
}

// V2 fields (version "b"): 51 bits. Adds chartColor and fontHeading.
var fieldsV2 = append(append([]field{}, fieldsV1...),
	field{"chartColor", ChartColors, 6},
	field{"fontHeading", FontHeadings, 5},
)

func (c *Config) get(key string) string {
	switch key {
	case "style":
		return c.Style
	case "baseColor":
		return c.BaseColor
	case "theme":
		return c.Theme
	case "chartColor":
		return c.ChartColor
	case "iconLibrary":
		return c.IconLibrary
	case "font":
		return c.Font
	case "fontHeading":
		return c.FontHeading
	case "radius":
		return c.Radius
	case "menuAccent":
		return c.MenuAccent
	case "menuColor":
		return c.MenuColor
	}
	return ""
}

func (c *Config) set(key, value string) {
	switch key {
	case "style":
		c.Style = value
	case "baseColor":
		c.BaseColor = value
	case "theme":
		c.Theme = value
	case "chartColor":
		c.ChartColor = value
	case "iconLibrary":
		c.IconLibrary = value
	case "font":
		c.Font = value
	case "fontHeading":
		c.FontHeading = value
	case "radius":
		c.Radius = value
	case "menuAccent":
		c.MenuAccent = value
	case "menuColor":
		c.MenuColor = value
	}
}

// DefaultConfig is the DEFAULT_PRESET_CONFIG pendant: every field at its
// values[0] default.
func DefaultConfig() Config {
	var c Config
	for _, f := range fieldsV2 {
		c.set(f.key, f.values[0])
	}
	return c
}

// Base62 alphabet.
const base62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

// Version prefixes. "a" = v1 (no chartColor), "b" = v2 (with chartColor).
const currentVersion = "b"

var validVersions = []string{"a", "b"}

// ToBase62 is the toBase62 pendant.
func ToBase62(num uint64) string {
	if num == 0 {
		return "0"
	}
	var result []byte
	for n := num; n > 0; n /= 62 {
		result = append([]byte{base62[n%62]}, result...)
	}
	return string(result)
}

// FromBase62 is the fromBase62 pendant: -1 for invalid characters.
func FromBase62(str string) int64 {
	var result int64
	for i := 0; i < len(str); i++ {
		idx := strings.IndexByte(base62, str[i])
		if idx == -1 {
			return -1
		}
		result = result*62 + int64(idx)
	}
	return result
}

// EncodePreset is the encodePreset pendant: encode a Config into a short
// alphanumeric code. Zero-valued (unset) fields fall back to their defaults,
// like the JS spread over DEFAULT_PRESET_CONFIG. Always produces v2 codes.
func EncodePreset(config Config) string {
	merged := DefaultConfig()
	for _, f := range fieldsV2 {
		if v := config.get(f.key); v != "" {
			merged.set(f.key, v)
		}
	}

	var bits uint64
	var offset uint
	for _, f := range fieldsV2 {
		idx := indexOf(f.values, merged.get(f.key))
		if idx == -1 {
			idx = 0
		}
		bits += uint64(idx) << offset
		offset += f.bits
	}

	return currentVersion + ToBase62(bits)
}

// DecodePreset is the decodePreset pendant: decode a preset code back into a
// Config. "a"-prefixed codes use v1 fields (no chartColor, ChartColor stays
// empty). Returns false for invalid codes (the null return).
func DecodePreset(code string) (Config, bool) {
	if len(code) < 2 {
		return Config{}, false
	}

	version := code[:1]
	if !contains(validVersions, version) {
		return Config{}, false
	}

	fields := fieldsV2
	if version == "a" {
		fields = fieldsV1
	}

	rawBits := FromBase62(code[1:])
	if rawBits < 0 {
		return Config{}, false
	}
	bits := uint64(rawBits)

	var result Config
	var offset uint
	for _, f := range fields {
		idx := (bits >> offset) & (1<<f.bits - 1)
		if idx < uint64(len(f.values)) {
			result.set(f.key, f.values[idx])
		} else {
			result.set(f.key, f.values[0])
		}
		offset += f.bits
	}

	if version == "a" {
		result.FontHeading = "inherit"
	}

	return result, true
}

// IsPresetCode is the isPresetCode pendant: whether a string looks like a
// preset code (version char + base62).
func IsPresetCode(value string) bool {
	if len(value) < 2 || len(value) > 10 {
		return false
	}

	if !contains(validVersions, value[:1]) {
		return false
	}

	for i := 1; i < len(value); i++ {
		if strings.IndexByte(base62, value[i]) == -1 {
			return false
		}
	}

	return true
}

// IsValidPreset is the isValidPreset pendant: whether a preset code decodes
// successfully.
func IsValidPreset(code string) bool {
	_, ok := DecodePreset(code)
	return ok
}

// GenerateRandomConfig is the generateRandomConfig pendant.
func GenerateRandomConfig() Config {
	var c Config
	for _, f := range fieldsV2 {
		c.set(f.key, f.values[rand.Intn(len(f.values))])
	}
	return c
}

// GenerateRandomPreset is the generateRandomPreset pendant.
func GenerateRandomPreset() string {
	return EncodePreset(GenerateRandomConfig())
}

func contains(values []string, v string) bool {
	return indexOf(values, v) != -1
}

func indexOf(values []string, v string) int {
	for i, x := range values {
		if x == v {
			return i
		}
	}
	return -1
}
