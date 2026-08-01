---
title: "Dark Mode"
description: "Adding dark mode to your site."
order: 5
---

<Steps>

## Create an inline theme script

Add an inline script to the `<head>` of your base layout. It runs before the body renders, reads the stored preference from `localStorage`, and toggles the `dark` class on the `<html>` element so the page never flashes the wrong theme.

```templ title="layouts/base.templ" showLineNumbers
templ BaseLayout(title, description string) {
	<!DOCTYPE html>
	<html lang="en">
		<head>
			// Theme initialization - must run before body renders to prevent flash
			<script nonce={ templ.GetNonce(ctx) }>
				(function() {
					// Get current theme preference (system, light, or dark)
					function getThemePreference() {
						return localStorage.getItem('theme') || 'system';
					}

					const preference = getThemePreference();
					let isDark = false;

					if (preference === 'system') {
						// Use system preference
						isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
					} else {
						// Use explicit preference
						isDark = preference === 'dark';
					}

					// Apply theme immediately to prevent flash
					if (isDark) {
						document.documentElement.classList.add('dark');
					}
				})();
			</script>
		</head>
		<body>
			{ children... }
		</body>
	</html>
}
```

The preference is stored in `localStorage` under the `theme` key as `light`, `dark`, or `system`. With `system`, the script follows the operating system via `prefers-color-scheme`.

## Add a mode toggle

```templ title="components/themeswitcher/themeswitcher.templ" showLineNumbers
package themeswitcher

import (
	"github.com/templui/templui/components/button"
	"github.com/templui/templui/components/icon"
)

templ ThemeSwitcher() {
	<script nonce={ templ.GetNonce(ctx) }>
		(function() {
			// Make theme functions globally available for the switcher
			window.themeUtils = window.themeUtils || {};

			// Get current theme preference (system, light, or dark)
			window.themeUtils.getThemePreference = function() {
				return localStorage.getItem('theme') || 'system';
			}

			// Apply theme based on preference
			window.themeUtils.applyTheme = function() {
				const preference = window.themeUtils.getThemePreference();
				let isDark = false;

				if (preference === 'system') {
					isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				} else {
					isDark = preference === 'dark';
				}

				document.documentElement.classList.toggle('dark', isDark);
			}

			// Toggle between light and dark (system only on initial state)
			window.themeUtils.cycleTheme = function() {
				const current = window.themeUtils.getThemePreference();
				let next;

				if (current === 'system') {
					// First click from system state - determine based on current appearance
					const isDarkNow = window.matchMedia('(prefers-color-scheme: dark)').matches;
					next = isDarkNow ? 'light' : 'dark';
				} else {
					// Toggle between light and dark
					next = current === 'light' ? 'dark' : 'light';
				}

				localStorage.setItem('theme', next);
				window.themeUtils.applyTheme();
			}

			// Listen for system theme changes
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
				if (window.themeUtils.getThemePreference() === 'system') {
					window.themeUtils.applyTheme();
				}
			});

			// Use event delegation for click handling
			document.addEventListener('click', (e) => {
				const themeSwitcher = e.target.closest('[data-theme-switcher]');
				if (themeSwitcher) {
					e.preventDefault();
					window.themeUtils.cycleTheme();
				}
			});
		})();
	</script>
	@button.Button(button.Props{
		Size:    button.SizeIcon,
		Variant: button.VariantGhost,
		Attributes: templ.Attributes{
			"data-theme-switcher": "true",
		},
	}) {
		@icon.Eclipse(icon.Props{Class: "size-5"})
	}
}
```

## Display the mode toggle

Place a mode toggle on your site to toggle between light and dark mode.

```templ title="layouts/base.templ"
import "your-app/components/themeswitcher"

templ BaseLayout(title, description string) {
	<!DOCTYPE html>
	<html lang="en">
		<!-- Inline script -->
		<body>
			@themeswitcher.ThemeSwitcher()
			{ children... }
		</body>
	</html>
}
```

</Steps>
