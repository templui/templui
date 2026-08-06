// Pendant of the cn-rtl-flip marker handling in shadcn
// packages/shadcn/src/utils/transformers/transform-rtl.ts: applyRtlMapping
// replaces the marker with rtl:rotate-180 when the build targets RTL
// (exact whole-token comparison, className === RTL_FLIP_MARKER); without RTL
// the transformer is a no-op and transformCleanup strips the marker.
//
// The physical→logical class mappings of transform-rtl.ts (RTL_MAPPINGS etc.)
// are not ported here: shadcn-templ's components already carry logical utilities
// where they matter, and the task of this package is the style inlining.
package inliner

// rtlFlipMarker mirrors RTL_FLIP_MARKER.
const rtlFlipMarker = "cn-rtl-flip"

// transformRtl ports the marker branch of applyRtlMapping.
func transformRtl(sourceFile *sourceFile, _ StyleMap, opts Options) {
	if !opts.RTL {
		return
	}

	sourceFile.forEachStringLiteral(func(value string) string {
		return replaceToken(value, rtlFlipMarker, "rtl:rotate-180")
	})
}

// replaceToken replaces whole space-separated tokens, preserving the
// surrounding class order (the split(" ")/flatMap walk of applyRtlMapping).
func replaceToken(value, token, replacement string) string {
	fields, changed := splitFieldsIfToken(value, token)
	if !changed {
		return value
	}
	for i, field := range fields {
		if field == token {
			fields[i] = replacement
		}
	}
	return joinFields(fields)
}
