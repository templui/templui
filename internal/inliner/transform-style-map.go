// 1:1 pendant of shadcn packages/shadcn/src/styles/transform-style-map.ts:
// replace the cn-* classes inside string literals with the utilities of the
// style map. ts-morph's cva/className/cn()/mergeProps walkers collapse into
// the single string-literal walk of the sourceFile pendant — in templ every
// class list is a plain string literal, so each one is handled like the
// reference handles a cva string (applyStyleToCvaString). There is no
// cross-literal matchedClasses set: it only deduplicates shadcn's cva-string
// vs. cn()-call duplication, which templ sources do not have; shadcn's
// className-attribute path expands every attribute independently, exactly
// like this port does.
package inliner

import (
	"regexp"
	"strings"

	"github.com/templui/templui/utils"
)

// allowlist mirrors ALLOWLIST: classes that are never inlined or removed here
// because the follow-up transformers handle them (transform-rtl,
// transform-menu, transform-font, transform-cleanup).
var allowlist = map[string]bool{
	"cn-menu-target":      true,
	"cn-menu-translucent": true,
	"cn-logical-sides":    true,
	"cn-rtl-flip":         true,
	"cn-font-heading":     true,
}

// cnClassRe mirrors the /\bcn-[\w-]+\b/g regex shared by
// extractCnClasses/removeCnClasses.
var cnClassRe = regexp.MustCompile(`\bcn-[\w-]+\b`)

var whitespaceRe = regexp.MustCompile(`\s+`)

// transformStyleMap ports transformStyleMap.
func transformStyleMap(sourceFile *sourceFile, styleMap StyleMap, _ Options) {
	sourceFile.forEachStringLiteral(func(value string) string {
		return applyStyleToString(value, styleMap)
	})
}

// applyStyleToString ports applyStyleToCvaString for one literal value:
//   - matched classes: the mapped utilities are merged in front of the
//     literal (mergeClasses(newClasses, existing)), so the literal's own
//     utilities keep winning conflicts, then every non-allowlisted cn-* token
//     is removed and whitespace collapsed;
//   - unknown cn-* classes (no style map entry, not allowlisted) are DROPPED:
//     map misses are filtered out and removeCnClasses strips every
//     non-allowlisted cn-* token;
//   - allowlisted markers are skipped here and resolved by the follow-up
//     transformers.
func applyStyleToString(value string, styleMap StyleMap) string {
	cnClasses := extractCnClasses(value)
	if len(cnClasses) == 0 {
		return value
	}

	// Skip allowlisted classes — they are handled by the marker transformers.
	var tailwindClassesToApply []string
	for _, cnClass := range cnClasses {
		if allowlist[cnClass] {
			continue
		}
		if classes, ok := styleMap[cnClass]; ok && classes != "" {
			tailwindClassesToApply = append(tailwindClassesToApply, classes)
		}
	}

	if len(tailwindClassesToApply) > 0 {
		mergedClasses := strings.Join(tailwindClassesToApply, " ")
		return removeCnClasses(mergeClasses(mergedClasses, value))
	}

	// No styles to apply, but non-allowlisted classes still get cleaned up.
	return removeCnClasses(value)
}

// extractCnClasses mirrors extractCnClasses.
func extractCnClasses(str string) []string {
	return cnClassRe.FindAllString(str, -1)
}

// removeCnClasses mirrors removeCnClasses: strip every non-allowlisted cn-*
// token, collapse whitespace, trim.
func removeCnClasses(str string) string {
	out := cnClassRe.ReplaceAllStringFunc(str, func(match string) string {
		// Preserve allowlisted classes
		if allowlist[match] {
			return match
		}
		return ""
	})
	return strings.TrimSpace(whitespaceRe.ReplaceAllString(out, " "))
}

// mergeClasses mirrors mergeClasses (twMerge(newClasses, existing)) on top of
// the repo's runtime merge. tailwind-merge-go resolves the same conflicts but
// emits the survivors in nondeterministic order, so the survivors are
// re-emitted in the JS twMerge order: input order, with the LAST occurrence
// of a duplicate winning.
func mergeClasses(newClasses, existing string) string {
	merged := utils.CN(newClasses, existing)

	survivors := map[string]int{}
	for _, token := range strings.Fields(merged) {
		survivors[token]++
	}

	tokens := strings.Fields(newClasses + " " + existing)
	kept := make([]string, 0, len(tokens))
	for i := len(tokens) - 1; i >= 0; i-- {
		token := tokens[i]
		if survivors[token] > 0 {
			survivors[token]--
			kept = append(kept, token)
		}
	}

	for i, j := 0, len(kept)-1; i < j; i, j = i+1, j-1 {
		kept[i], kept[j] = kept[j], kept[i]
	}
	return strings.Join(kept, " ")
}
