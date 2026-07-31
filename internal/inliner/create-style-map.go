// 1:1 pendant of shadcn packages/shadcn/src/styles/create-style-map.ts:
// turn a style-*.css sheet into a map of cn-* class → Tailwind utilities by
// extracting the @apply directives. The postcss/postcss-selector-parser pair
// is replaced by a minimal CSS block parser (parseRules, the postcss.parse
// pendant) and a selector scanner, everything else mirrors the reference:
// walkRules order, normalizeSelector, extractTailwindClasses, the
// findSubjectClass "last cn class wins" rule, and the prepend on repeated
// matches.
package inliner

import (
	"fmt"
	"regexp"
	"strings"
)

const cnPrefix = "cn-"

// StyleMap is the styleMapSchema pendant: cn-* class → utilities.
type StyleMap map[string]string

// cssRule is one parsed rule; at-rule blocks carry nil selectors so they are
// walked but never matched (postcss walkRules only yields rules).
type cssRule struct {
	selectors []string // prelude split on top-level commas
	applies   []string // params of the rule's direct @apply children, in order
	children  []*cssRule
}

// CreateStyleMap ports createStyleMap: for every rule with @apply directives,
// the utilities (joined in order) are assigned to the subject cn-* class of
// each of its selectors. Rules without @apply are skipped, non-@apply
// declarations are ignored, and when the same cn class matches again the new
// utilities are PREPENDED to the previously collected ones.
func CreateStyleMap(input string) (StyleMap, error) {
	rules, err := parseRules(input)
	if err != nil {
		return nil, err
	}

	result := StyleMap{}

	walkRules(rules, func(rule *cssRule) {
		if len(rule.selectors) == 0 {
			return
		}

		tailwindClasses := extractTailwindClasses(rule)
		if tailwindClasses == "" {
			return
		}

		for _, selector := range rule.selectors {
			normalizedSelector := normalizeSelector(selector)

			className := findSubjectClass(normalizedSelector)
			if className == "" || !strings.HasPrefix(className, cnPrefix) {
				continue
			}

			if existing, ok := result[className]; ok {
				result[className] = tailwindClasses + " " + existing
			} else {
				result[className] = tailwindClasses
			}
		}
	})

	return result, nil
}

// walkRules visits every rule in document order, nested ones included
// (postcss root.walkRules pendant).
func walkRules(rules []*cssRule, fn func(*cssRule)) {
	for _, rule := range rules {
		fn(rule)
		walkRules(rule.children, fn)
	}
}

var ampersandRe = regexp.MustCompile(`\s*&\s*`)

// normalizeSelector mirrors normalizeSelector: drop `&` with surrounding
// whitespace, then trim.
func normalizeSelector(selector string) string {
	return strings.TrimSpace(ampersandRe.ReplaceAllString(selector, ""))
}

// extractTailwindClasses mirrors extractTailwindClasses: the params of the
// rule's direct @apply children, trimmed and joined with a space; "" when the
// rule has none.
func extractTailwindClasses(rule *cssRule) string {
	return strings.Join(rule.applies, " ")
}

// findSubjectClass mirrors findSubjectClass: walk the class nodes of the
// selector (attribute selectors and quoted strings are no class nodes, just
// like in the selector grammar) and return the last one with the cn- prefix.
func findSubjectClass(selector string) string {
	subject := ""
	inBracket := 0
	var quote byte
	for i := 0; i < len(selector); i++ {
		c := selector[i]
		if quote != 0 {
			if c == quote {
				quote = 0
			}
			continue
		}
		switch c {
		case '\'', '"':
			quote = c
		case '[':
			inBracket++
		case ']':
			inBracket--
		case '.':
			if inBracket > 0 {
				continue
			}
			j := i + 1
			for j < len(selector) && isClassNameByte(selector[j]) {
				j++
			}
			if j > i+1 {
				className := selector[i+1 : j]
				if strings.HasPrefix(className, cnPrefix) {
					subject = className
				}
				i = j - 1
			}
		}
	}
	return subject
}

func isClassNameByte(c byte) bool {
	return c == '-' || c == '_' ||
		(c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
}

// MARK: postcss.parse pendant

// parseRules parses the sheet into a rule tree (comments stripped first, so
// commented-out rules never match).
func parseRules(css string) ([]*cssRule, error) {
	stripped := stripCSSComments(css)
	rules, _, rest, err := parseBlock(stripped, 0)
	if err != nil {
		return nil, err
	}
	if rest < len(stripped) {
		return nil, fmt.Errorf("inliner: unbalanced '}' at offset %d", rest)
	}
	return rules, nil
}

func stripCSSComments(css string) string {
	var b strings.Builder
	for i := 0; i < len(css); {
		if strings.HasPrefix(css[i:], "/*") {
			end := strings.Index(css[i+2:], "*/")
			if end < 0 {
				break
			}
			i += 2 + end + 2
			continue
		}
		b.WriteByte(css[i])
		i++
	}
	return b.String()
}

// parseBlock parses statements until the closing '}' (or EOF at the top
// level) and returns the child rules, the direct @apply params, and the
// offset after the block.
func parseBlock(css string, i int) (rules []*cssRule, applies []string, next int, err error) {
	start := i
	for i < len(css) {
		switch css[i] {
		case '{':
			prelude := strings.TrimSpace(css[start:i])
			children, childApplies, after, cerr := parseBlock(css, i+1)
			if cerr != nil {
				return nil, nil, 0, cerr
			}
			rule := &cssRule{applies: childApplies, children: children}
			if !strings.HasPrefix(prelude, "@") {
				rule.selectors = splitSelectors(prelude)
			}
			rules = append(rules, rule)
			i = after
			start = i
		case ';':
			stmt := strings.TrimSpace(css[start:i])
			if params, ok := strings.CutPrefix(stmt, "@apply"); ok {
				if value := strings.TrimSpace(params); value != "" {
					applies = append(applies, value)
				}
			}
			i++
			start = i
		case '}':
			return rules, applies, i + 1, nil
		default:
			i++
		}
	}
	if strings.TrimSpace(css[start:]) != "" {
		return nil, nil, 0, fmt.Errorf("inliner: unterminated rule %q", strings.TrimSpace(css[start:]))
	}
	return rules, applies, i, nil
}

// splitSelectors splits a rule prelude on commas outside of brackets, parens
// and quotes (rule.selectors pendant).
func splitSelectors(prelude string) []string {
	var out []string
	depth := 0
	var quote byte
	last := 0
	for i := 0; i < len(prelude); i++ {
		c := prelude[i]
		if quote != 0 {
			if c == quote {
				quote = 0
			}
			continue
		}
		switch c {
		case '\'', '"':
			quote = c
		case '[', '(':
			depth++
		case ']', ')':
			depth--
		case ',':
			if depth == 0 {
				if s := strings.TrimSpace(prelude[last:i]); s != "" {
					out = append(out, s)
				}
				last = i + 1
			}
		}
	}
	if s := strings.TrimSpace(prelude[last:]); s != "" {
		out = append(out, s)
	}
	return out
}
