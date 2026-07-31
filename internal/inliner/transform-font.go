// Pendant of shadcn packages/shadcn/src/utils/transformers/transform-font.ts:
// the cn-font-heading marker becomes the font-heading utility when the target
// project supports it (shadcn: its Tailwind CSS defines --font-heading; here:
// Options.FontHeading) and is stripped otherwise (rewriteFontMarkers).
package inliner

// fontMarkers mirrors FONT_MARKERS.
var fontMarkers = []struct {
	marker  string
	utility string
}{
	{marker: "cn-font-heading", utility: "font-heading"},
}

// transformFont ports transformFont.
func transformFont(sourceFile *sourceFile, _ StyleMap, opts Options) {
	sourceFile.forEachStringLiteral(func(value string) string {
		for _, fontMarker := range fontMarkers {
			if opts.FontHeading {
				value = replaceToken(value, fontMarker.marker, fontMarker.utility)
			} else {
				value = removeToken(value, fontMarker.marker)
			}
		}
		return value
	})
}
