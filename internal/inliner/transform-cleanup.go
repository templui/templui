// Pendant of shadcn
// packages/shadcn/src/utils/transformers/transform-cleanup.ts: strip every
// cn-* marker that is still left after the style map and the marker
// transformers ran (with RTL off that includes cn-rtl-flip, plus
// cn-logical-sides). Like the reference, the font markers are left alone —
// transformFont resolves them afterwards.
//
// Deviation: the reference works on a tsx AST and never sees comments, and
// shadcn's sources carry no cn-* prose. templUI's component comments document
// the cn mechanism ("the look comes from the active style-*.css via the
// cn-button-* classes"), so cleanupComments also drops those references —
// the distribution output must be free of cn-*.
package inliner

import (
	"regexp"
	"strings"
)

// preservedCnMarkers mirrors PRESERVED_CN_MARKERS: generic cleanup should
// leave font markers alone until transformFont runs.
var preservedCnMarkers = map[string]bool{
	"cn-font-heading": true,
}

// cnMarkerRe mirrors CN_MARKER_REGEX.
var cnMarkerRe = regexp.MustCompile(`\bcn-[a-z-]+\b`)

// commentCnMarkerRe additionally swallows the wildcard of prose references
// like "the cn-button-* classes", plus the leading space.
var commentCnMarkerRe = regexp.MustCompile(`[^\S\n]*\bcn-[\w-]+\*?`)

// transformCleanup ports transformCleanup (via stripCnMarkers) and applies
// the comment deviation described above.
func transformCleanup(sourceFile *sourceFile, _ StyleMap, _ Options) {
	sourceFile.forEachStringLiteral(func(value string) string {
		if !hasRemovableCnMarker(value) {
			return value
		}
		return stripCnMarkers(value)
	})

	sourceFile.forEachComment(cleanupComment)
}

func isRemovableCnMarker(token string) bool {
	return cnMarkerRe.MatchString(token) && !preservedCnMarkers[token]
}

// stripCnMarkers mirrors stripCnMarkers: drop every removable cn-* token.
func stripCnMarkers(value string) string {
	fields := strings.Fields(value)
	out := fields[:0]
	for _, token := range fields {
		if !isRemovableCnMarker(token) {
			out = append(out, token)
		}
	}
	return strings.Join(out, " ")
}

func hasRemovableCnMarker(value string) bool {
	for _, token := range strings.Fields(value) {
		if isRemovableCnMarker(token) {
			return true
		}
	}
	return false
}

func cleanupComment(comment string) string {
	if !strings.Contains(comment, cnPrefix) {
		return comment
	}
	return commentCnMarkerRe.ReplaceAllString(comment, "")
}

// MARK: shared token helpers for the marker transformers

// splitFieldsIfToken returns the space-separated fields of value when it
// contains token as a whole field, mirroring the includes()-guard plus
// split/join normalization of the reference transformers.
func splitFieldsIfToken(value, token string) ([]string, bool) {
	if !strings.Contains(value, token) {
		return nil, false
	}
	fields := strings.Fields(value)
	for _, field := range fields {
		if field == token {
			return fields, true
		}
	}
	return nil, false
}

func joinFields(fields []string) string {
	return strings.Join(fields, " ")
}
