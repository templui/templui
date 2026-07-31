// Pendant of shadcn packages/shadcn/src/utils/transformers/transform-menu.ts
// for the default menuColor: cn-menu-target and cn-menu-translucent are
// removed ("Otherwise, removes both cn-menu-target and cn-menu-translucent").
// The inverted/translucent menu colors are a shadcn install-time option that
// templUI does not expose, so only the default branch is ported.
package inliner

// transformMenu ports the default-menuColor branch of transformMenu.
func transformMenu(sourceFile *sourceFile, _ StyleMap, _ Options) {
	sourceFile.forEachStringLiteral(func(value string) string {
		value = removeToken(value, "cn-menu-target")
		value = removeToken(value, "cn-menu-translucent")
		return value
	})
}

// removeToken drops whole space-separated tokens, preserving the surrounding
// class order.
func removeToken(value, token string) string {
	fields, changed := splitFieldsIfToken(value, token)
	if !changed {
		return value
	}
	out := fields[:0]
	for _, field := range fields {
		if field != token {
			out = append(out, field)
		}
	}
	return joinFields(out)
}
