// css_state.go is the pendant of extractCssState in src/preset/resolve.ts:
// read the variables and imports the preset resolver matches against.
package updaters

import (
	"os"
	"strings"
)

// CSSState is the CssState pendant.
type CSSState struct {
	RootVars  map[string]string
	DarkVars  map[string]string
	ThemeVars map[string]string
	Imports   []string
}

// ExtractCSSStateFromFile reads the Tailwind entry file into a CSSState. A
// missing or unreadable file returns the empty state, like the reference.
func ExtractCSSStateFromFile(path string) CSSState {
	state := CSSState{
		RootVars:  map[string]string{},
		DarkVars:  map[string]string{},
		ThemeVars: map[string]string{},
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return state
	}
	extractCSSState(parseCSS(string(data)), &state)
	return state
}

// parseImportSource is the parseImportSource pendant: unwrap url(...) and
// quotes. Go's RE2 has no backreferences, so this is string surgery.
func parseImportSource(params string) string {
	params = strings.TrimSpace(params)
	if inner, ok := strings.CutPrefix(params, "url("); ok {
		params, ok = strings.CutSuffix(inner, ")")
		if !ok {
			return ""
		}
		params = strings.TrimSpace(params)
	}
	if len(params) >= 2 && (params[0] == '"' || params[0] == '\'') {
		if params[len(params)-1] != params[0] {
			return ""
		}
		return params[1 : len(params)-1]
	}
	return params
}

func extractCSSState(nodes []*cssNode, state *CSSState) {
	for _, node := range nodes {
		if !node.block {
			if params, ok := strings.CutPrefix(node.prelude, "@import "); ok {
				if source := parseImportSource(params); source != "" {
					state.Imports = append(state.Imports, source)
				}
			}
			continue
		}

		switch {
		case selectorListContains(node.prelude, ":root"):
			collectDeclarations(node, state.RootVars)
		case selectorListContains(node.prelude, ".dark"):
			collectDeclarations(node, state.DarkVars)
		case node.prelude == "@theme inline":
			collectDeclarations(node, state.ThemeVars)
		}

		// The reference walks all rules (media queries, layers).
		extractCSSState(node.children, state)
	}
}

func selectorListContains(selector, needle string) bool {
	if strings.HasPrefix(selector, "@") {
		return false
	}
	for _, part := range strings.Split(selector, ",") {
		if strings.TrimSpace(part) == needle {
			return true
		}
	}
	return false
}

func collectDeclarations(node *cssNode, target map[string]string) {
	for _, child := range node.children {
		if child.decl && strings.HasPrefix(child.prop, "--") {
			target[child.prop] = strings.TrimSpace(child.value)
		}
	}
}
