// Pendant of shadcn packages/shadcn/src/utils/transformers/transform-menu.ts:
// cn-menu-target and cn-menu-translucent resolve per config.menuColor.
// "inverted"/"inverted-translucent" replace cn-menu-target with "dark",
// otherwise it is removed. The translucent colors merge the hardcoded
// TRANSLUCENT_CLASSES over the class list (twMerge argument order: the
// translucent classes win), otherwise cn-menu-translucent is removed.
package inliner

// translucentClasses is transform-menu.ts's TRANSLUCENT_CLASSES: "Hardcoded
// translucent classes inlined at install time."
const translucentClasses = "animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!"

// transformMenu ports transformMenu with all four menuColor branches.
func transformMenu(sourceFile *sourceFile, _ StyleMap, opts Options) {
	inverted := opts.MenuColor == "inverted" || opts.MenuColor == "inverted-translucent"
	translucent := opts.MenuColor == "default-translucent" || opts.MenuColor == "inverted-translucent"

	sourceFile.forEachStringLiteral(func(value string) string {
		if inverted {
			value = replaceToken(value, "cn-menu-target", "dark")
		} else {
			value = removeToken(value, "cn-menu-target")
		}
		if translucent {
			if _, ok := splitFieldsIfToken(value, "cn-menu-translucent"); ok {
				value = mergeClasses(removeToken(value, "cn-menu-translucent"), translucentClasses)
			}
		} else {
			value = removeToken(value, "cn-menu-translucent")
		}
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

