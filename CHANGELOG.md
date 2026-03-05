# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v1.6.0] - 2026-03-02

### Added
- icons: Synced generated icons with the latest Lucide release
- input: Added `Required` to `Props` (thanks @tacheraSasi)
- selectbox: Added fuzzy search matching for improved item filtering

### Fixed
- toast: Restored progress pause/resume behavior for initial and swapped toasts

## [v1.5.0] - 2026-02-08

### Added
- CLI: Added `--installed` for bulk component updates via `templui --installed add[@<ref>]`
- selectbox: Added a clear button in the trigger for faster value reset
- selectbox: Improved keyboard/focus behavior when `nosearch` is enabled
- selectbox: Simplified selected-state handling using Tailwind/data-attribute conditionals instead of JS toggling
- timepicker: Preselected hour/minute values are now auto-scrolled into view when opening
- Updated progress examples to match the current API

### Removed
- CLI: Removed short-form aliases (`-f`, `-v`, `-h`, `-m`) in favor of explicit long flags

### Fixed
- toast: Fixed initialization for toasts on full page loads

## [v1.4.0] - 2026-01-29

### Added
- Add autocomplete suggestions
- Add popover script requirement for Tags Input
- Add autocomplete showcase for Tags Input

## [v1.3.0] - 2026-01-20

### Added
- `templui upgrade` now updates both CLI and utils

## [v1.2.0] - 2026-01-14

### Added
- add overridable ScriptURL function for custom cache busting

## [v1.1.1] - 2026-01-13

### Added
- No more interactive prompts - just `templui new myapp`
- Use module path directly: `templui new github.com/user/myapp` creates `myapp/` folder
- switch: Added documentation explaining `switchcomp` alias

### Changed
- Streamlined `new` command: Project setup is now fully automatic
- `templ generate` and `go mod tidy` run automatically

### Fixed
- checkbox: Fixed icon centering on custom sized classes using `inset-0`

## [v1.1.0] - 2026-01-05

### Added
- Add group support with indeterminate state
- Expose ymin, ymax and beginatzero

### Removed
- Remove overflow container (breaking)

### Fixed
- Scrollbars styling @RimJur

## [v1.0.1] - 2026-01-04

### Changed
- Bump to templ v0.3.977
- Lower Go version to 1.24 for distro package compatibility (thanks @RimJur)

### Removed
- Remove Go and templ version requirements

### Fixed
- Replace iframe preview docScr with src + separate route to avoid double char escaping
- Update calendar.templ
- Support nested collapsibles
- Replace text-destructive-foreground with text-white

## [v1.0.0] - 2025-12-24

### Changed
- We made it.
- 1,564 commits. 231 merged PRs. 146 closed issues. 29 contributors. 101 releases. 41 components.
- One major version.
- Two-way binding for Datepicker, Timepicker & Rating
- Improved quickstart template
- To everyone who opened an issue, submitted a PR, or shipped something with templUI - this release is for you.
- Happy holidays.

### Fixed
- Package name fix for custom directories

## [v0.101.0] - 2025-11-17

### Added
- Add AI-ready registry system
- Add `/llms.txt` endpoint
- Add component metadata (categories, tags, dependencies)

### Changed
- Refactor sidebar to use registry
- Automate component metadata generation

## [v0.100.0] - 2025-11-16

### Added
- Documentation links added to installed components
- Dialog: Add DisableAutoFocus prop to control auto-focus behavior
- Simplify how-to-use guide and add Tailwind auto-fallback

### Changed
- Markdown documentation system for general documentation pages
- Migration to Go 1.24 tool directive for dev tools
- Automatic version detection via build info - no more manual version updates needed
- Tooltip: Pass Class and Attributes to popover trigger
- Smooth scroll position now shared between markdown and component docs on TOC link clicks
- Dev Server: Replace Air with templ-managed server for instant hot reload
- Reformatted codebase
- Disabled style attribute linter
- Docs footer now dragged to bottom
- Beautified announcement and navbar

### Removed
- Remove duplicate code in input.css example
- Removed redundant version field from manifest.json

### Fixed

## [v0.99.0] - 2025-11-02

### Added
- Calendar: Data attributes added for flexible styling with Class prop
- Added goilerplate links to navbar/menu and announcement bar

### Changed
- Alert: Design aligned with shadcn/ui
- Prioritize explicit For prop over context in Trigger
- Dropdown/Popover: Close non-exclusive only if it's a parent/trigger
- Reformatted codebase
- Cache busting + JS files to copy button

### Removed
- ⚠️ Breaking Changes
- Form Components: Removed Required prop from all form components (input, checkbox, radio, textarea, selectbox, inputotp, timepicker, datepicker). Server-side validation is now the only validation approach, as browser validation doesn't work with hidden inputs and creates confusion about validation responsibility.
- Automatic cleanup for DOM removal - fixes body.overflow stuck when dialogs removed via HTMX/innerHTML
- Dropdown: Removed unused Class and Attributes from Props
- Dialog: Removed unnecessary disabled state

### Fixed

## [v0.98.0] - 2025-10-02

### Added
- New standalone component
- Code component simplified (no longer includes copy button)
- Month and year selection dropdowns
- New time input showcase examples
- Time input showcase examples (default + styled)
- `Exclusive` prop – auto-closes other popovers when opening
- Automatic script versioning on app restart
- Updated Lucide icons to v0.544.0
- Custom width support via CSS variables
- Copy Button: The `Code` component no longer includes a copy button. Use the new standalone `Copy Button` component instead (thanks @jaredweinfurtner, @shtayeb, @nenad, and @ananyatimalsina for their contributions!)

### Changed

### Removed
- Dropdown: removed dynamic class generation
- Avatar: API simplified to match shadcn/ui pattern

### Fixed
- Select Box: two-way binding with reactive frameworks
- Transform-based offcanvas animation
- Toast: stable progress indicator rendering
- Dialog: close button now type="button" to prevent form submit
- Code: respects DOM swaps

## [v0.97.0] - 2025-09-15

### Added
- Global JS API
- Exposed programmatic API for `Dialog`, `Popover` and `Tabs`
- → allows triggering components from external events (e.g. Mapbox markers) via
- `window.tui.<component>.<function>()`
- Sidebar
- New configurable `shortcut` option for toggling
- Sheet
- Width can now be overridden via props

### Removed
- Removed ESC key close handler

### Fixed
- Sidebar Docs – fixed incorrect script path shown in examples
- Popover – exposed missing `closeAllPopovers()` in `window.tui.popover` API

## [v0.96.0] - 2025-09-03

### Added
- inset styling restored.
- new `Trigger` prop → supports multiple sidebars at once (e.g. left + right).
- can now be used without a wrapper – trigger + content work standalone.
- internally powered by the new `Dialog` component (formerly `Modal`).

### Changed
- updated sitemap.

### Removed
- removed outer div so layout renders correctly.
- Modal → Dialog: The old `Modal` component has been removed. Please use `Dialog` instead.

### Fixed
- fixed peer selectors for inset variant.
- Avatar: fallback text now shows correctly if the image fails.
- fixed theme copy dialog.
- fixed sheet demos (padding & scrolling).
- minor cleanups + consistency fixes.

## [v0.95.0] - 2025-09-01

### Added
- Sheet: custom widths are respected again.
- Docs & CLI: now show how to update components.
- Added documentation for persisted sidebar state.

### Changed
- Cleaned up unused sidebar code + properties.

### Removed
- removed automatic cookie restore to prevent flicker.
- Modal: only closes on backdrop clicks (not child elements).

### Fixed
- Sidebar: new portal pattern for state + rendering (fixes duplicate content/IDs, smoother performance).
- API Docs: corrected `collapsible` attribute. (thanks @shtayeb)
- fixed cookie pollution with proper global state persistence (`sidebar_state`).
- `Collapsed` prop now works for SSR.
- Calendar: fixed year navigation bug when jumping from December → January or backwards.
- fixed tooltip hover conflicts caused by duplicate IDs.
- Typo + minor consistency fixes.

## [v0.94.0] - 2025-08-28

### Added
- Sheet: new wrapper (auto IDs, no manual wiring), `Position` → `Side`.
- Sidebar: root-level, new layouts (default/inset/floating), fullscreen demo, icons-only + tooltips, smoother collapse.
- Inputs: more input types. (thanks @RimJur)
- Checkbox: restyled (sharper).
- Avatar: simplified API + styling.
- Sheet: `Position` → `Side`, new wrapper required.

### Removed
- Sheet + Toast: init logic removed/simplified.
- Removed Alpine.js, empty props, and `templui.min.js` (use per-component scripts).

### Fixed
- Select Box: placeholder fixed. (thanks @CarraraVitor)
- Popover: arrow + positioning fixed.
- Toast: playground fixed, init simplified.
- Sidebar: avatar on collapsed icons-only, linter/ID issues.
- Decoupled theme init, typo fixes.

## [v0.93.0] - 2025-08-23

### Added
- Dropdown now has placements.

### Removed
- BREAKING: Drawer renamed to Sheet.
- Removed old examples, cleanup, deployment tweaks.

### Fixed
- Calendar init fixed with observer.
- Sidebar chevron rotation corrected.

## [v0.92.0] - 2025-08-21

### Added
- Sidebar: Brand-new flagship component → supports submenus, badges, keyboard controls, and auto-reinit on DOM changes.
- Collapsible: Added new component for simple expandable/collapsible sections.
- Date Picker Docs: Added missing `calendar.js` in installation instructions.

### Fixed
- Calendar: Fixed navigation buttons (next/prev month now respond correctly).

## [v0.91.0] - 2025-08-20

### Added
- Form attribute support: Added `form` attribute to all form-enabled components (Button, Checkbox, Input, InputOTP, Radio, Textarea, TagsInput, Rating, DatePicker, TimePicker, SelectBox, Switch) — thanks @glsubri 🎉
- Switch (formerly Toggle): Renamed `Toggle` → `Switch` for semantic clarity and closer alignment with shadcn/ui. Restyled smaller & cleaner.

### Changed
- General cleanup & simplifications across form showcases.
- Multiple `go fmt` formatting passes on form components.

### Removed
- Checkbox Card & Radio Card: Removed redundant components → use Checkbox/Radio directly. Showcases simplified and made more readable.

### Fixed
- Tags Input: Props are now optional (consistent with other form components).
- Switch/Checkbox submission: Fixed behavior for form submission values.

## [v0.90.0] - 2025-08-19

### Added
- Event Delegation Migration.
- This makes components more robust with DOM swaps (htmx, datastar, alpine.js, …) since no re-initialization or afterswap listeners are needed anymore — everything works out of the box.
- *⚠️ Note: Large JS refactor → possible regressions. Please report any issues!*
- Tabs: Restyled closer to shadcn/ui
- Accordion: New component, aligned with shadcn/ui
- Script Tags: Added support for `nonce` attributes on generated component scripts
- Navigation/SEO: Page title now updates correctly when clicking menu links (with fragment support in newer templ versions; thanks -h)

### Changed
- Major cleanup and JS simplifications across Carousel, Avatar, TimePicker, SelectBox, Drawer, Modal, Tabs, Toast, and more
- LOC changes: +2,596 / −3,559

### Removed
- Removed almost all direct event listeners → switched to a full event-delegation pattern.
- Removed framework integration section from docs (no longer necessary with event delegation)

### Fixed
- Disabled States: Restored correct behavior for disabled popover triggers (affects Popover, DatePicker, TimePicker, …)

## [v0.87.1] - 2025-08-17

### Added
- Calendar/Date Picker: Added `startOfWeek` option (Sunday or Monday) — thanks @glsubri
- Carousel: Added swipe gesture support → fully mobile-friendly
- Time Picker: Added `step`, `min`, and `max` constraints for better control

### Changed
- Version bump in code (missed in v0.87.0)

### Fixed
- Charts: Fixed disappearing on light/dark theme switch
- Date/Time Picker: Hidden inputs now inside forms → form submission works correctly — thanks @glsubri
- Carousel: Fixed invisible indicators in light mode
- Navigation: Corrected TOC and page order

## [v0.87.0] - 2025-08-17

### Added
- Calendar/Date Picker: Added `startOfWeek` option (Sunday or Monday) — thanks @glsubri
- Carousel: Added swipe gesture support → fully mobile-friendly
- Time Picker: Added `step`, `min`, and `max` constraints for better control

### Fixed
- Charts: Fixed disappearing on light/dark theme switch
- Date/Time Picker: Hidden inputs now inside forms → form submission works correctly — thanks @glsubri
- Carousel: Fixed invisible indicators in light mode
- Navigation: Corrected TOC and page order

## [v0.86.0] - 2025-08-07

### Added
- reintroduced and restyled `Time Picker` component (thanks @derkan for the nudge)
- made `Tabs` component scrollable on mobile (thanks @RimJur)

### Changed
- updated sitemap for SEO

### Fixed
- completed migration to `data-tui-*` naming across all components for consistency and conflict-free usage
- drawer no longer closes when clicking inside portal elements like popovers – now only closes via close trigger or backdrop
- cleaned up leftover event listeners properly on HTMX swaps (thanks @CarraraVitor)
- added missing `input` dependency for proper rendering (thanks @eryk-vieira)
- corrected internal `data-*` attribute name to ensure input values are set (thanks @glsubri)

## [v0.85.0] - 2025-07-27

### Added
- sidebar menu now stays open between page transitions via HTMX (no full reload required)

### Changed
- implemented proper `404` routing for improved UX & SEO
- rebranded from `axzilla/templui` to `templui/templui` 🎉
- improved Pro upgrade bar visuals
- regenerated sitemap

### Removed
- removed unnecessary `stopPropagation` logic to improve compatibility with nested components
- removed unnecessary cleanup examples from `Popover`, `Drawer`, etc.

### Fixed
- introduced `data-tui-*` prefix convention across all components to avoid attribute conflicts (selectbox, drawer, calendar, etc.) – now future-proof & compatible with frameworks like HTMX & DataStar ( thanks @axadrn)
- fix alignment for `a` tag inside dropdown items (`justify-between`, thanks @glsubri)
- corrected text color for `destructive` variant
- renamed internal `data-*` attributes to avoid conflicts (e.g., `data-show`, `data-selected`, etc.)

## [v0.84.0] - 2025-07-19

### Added
- new `templui upgrade` command – upgrade to latest or specific version without `go install` (thanks @vague2k)
- native `type="reset"` now also resets templUI form components: `selectbox`, `tagsinput`, `datepicker`, `calendar`, `rating`
- moved attributes from trigger button to hidden input to support `name`, `id`, etc. (thanks @scottmckendry)
- introduced new `data-tui-*` attribute naming to avoid conflicts with frameworks like HTMX or DataStar (prototype implementation, more components will follow) (thanks @scottmckendry)
- added non-www redirect

### Changed
- updated DataStar usage examples (thanks @scottmckendry)
- improved theme editor colors and light/dark mode handling
- updated favicons (incl. Safari), meta tags, and social previews

### Fixed
- clarified required `for` and `contentId` for `@tooltip` (thanks @jaingounchained)
- corrected wildcard usage to `"*"` for installing all components
- corrected `--force` usage example in CLI help

## [v0.83.1] - 2025-07-09

### Added
- add close transition (@scottmckendry)
- add icon size usage hints for `@button` and `@badge`

### Changed
- _Re-published due to an outdated Go proxy cache of v0.83.0. No additional changes._

### Removed
- removed component (BREAKING)
- remove outdated htmx example from `@button` showcase

### Fixed
- prevent font flicker during load

## [v0.83.0] - 2025-07-09

### Added
- add close transition (@scottmckendry)
- add icon size usage hints for `@button` and `@badge`

### Removed
- removed component (BREAKING)
- remove outdated htmx example from `@button` showcase

### Fixed
- prevent font flicker during load

## [v0.82.0] - 2025-07-08

### Added
- Part 2: new components with the new design system

### Changed
- Why reinvent the wheel when shadcn/ui already nailed it?
- This release brings templUI’s design system closer to battle-tested patterns that just work – while still keeping it very Go, very templ, and very lightweight.
- It’s not a copy-paste job. It’s about learning from the best and making it ours.
- Design, cleaned up. Hard.
- Shifted to a cleaner, more structured look
- Inspired by shadcn/ui – but tailored for Go devs
- Font upgraded to *Geist* – easier on the eyes
- Theme editor reworked – actually usable now
- Theme switching in vanilla JS – no bloat
- Buttons: now in sm, md, lg (finally)
- Components follow one consistent language
- Refactored a bunch of messy internals
- Better mobile experience
- Dark mode? Now actually good
- Good UI shouldn't fight you. This release lays the foundation for a smoother, faster, more maintainable component system – one that feels familiar if you’ve touched shadcn, but made for Go devs like us.
- More variants, better docs, tighter code
- Feedback loop is open – tell me what sucks

### Removed
- Deleted hundreds of lines of CSS no one asked for

## [v0.81.1] - 2025-06-29

### Fixed
- Manifest Fix: `tagsinput` was missing from the CLI component manifest – now added properly
- → You can now install it via CLI without issues.
- A small fix – but now `tagsinput` works as expected via CLI. Thanks for your patience. 🙏

## [v0.81.0] - 2025-06-29

### Added
- 🔗 Decoupled Triggers: Modal, Drawer, Popover now support `data-*-trigger` from *any* element
- → Use buttons, links, dropdown items, or multiple triggers per target – no more nesting needed
- → Better JS integration & Tailwind-friendly styling via `data-open`
- 📘 API Docs: All components now have full API reference in the docs
- ⚡ Smarter Swaps: Components mark themselves with `initialized=true` → only new elements are re-inited after HTMX/Datastar swaps
- 🧹 Docs Cleanup.
- Better HTMX/Datastar usage

### Changed
- 👉 [Integration Guide](https://templui.io/docs/how-to-use#framework-integration)
- templUI keeps getting leaner, faster, and more flexible. No lock-ins. No fluff. Just clean UI.

### Removed
- 🆕 TagsInput (thx @derkan): Add/remove tags with `[]string` binding, `readonly`, `disabled`, and duplicate prevention
- 💥 Breaking: JS `initAllComponents` → now just `init()`
- `card.Media` removed, examples use `aspect-ratio`

### Fixed
- Typo fix (thx @brtholomy)

### Security
- Removed CSP-related code

## [v0.80.2] - 2025-06-23

### Added
- Complete framework decoupling - templUI components now expose clean `window.templUI.*` APIs instead of hardcoded HTMX event listeners
- Add comprehensive framework integration documentation with examples for HTMX, Datastar, and manual initialization
- Add Gopher mascot image and enhance features section with detailed framework-agnostic benefits
- Enhance 'How To Use' documentation with structured sections and detailed integration guides
- Add performance notes explaining HTMX vs Datastar trade-offs (targeted vs global re-initialization)
- Add submenus to documentation navigation for better discoverability
- 📈 Better Performance: Targeted re-initialization where supported (HTMX)

### Changed
- 🛠️ Patch Note
- This is a version bump release to sync the internal version with the actual tag.
- If you're using go install, make sure to use v0.80.2.
- Improve ESLint configuration for JavaScript files for better development experience
- Clean component APIs - all components now follow consistent `initAllComponents(root)` pattern
- 🎯 Framework Agnostic: Works with HTMX, Datastar, Alpine.js, or any framework
- 🔮 Future Proof: Ready for whatever hypermedia framework comes next
- 🧹 Cleaner APIs: Consistent component interfaces across the board
- 🧪 Easier Testing: No framework dependencies in component code
- 🚀 Broader Adoption: Not tied to specific ecosystems (thanks everyone who provided feedback on [RFC discussion](https://github.com/axzilla/templui/discussions/251); thanks @vague2k for honest developer experience perspective; thanks @delaneyj (Datastar author) for collaboration insights; thanks @chris-perardi for startup use case validation; thanks @glsubri for thoughtful component API feedback)
- This change represents templUI's evolution from an HTMX-focused library to a truly universal Go/templ component system! 🎉
- 📖 Migration Guide: [Framework Integration Docs](https://templui.io/docs/how-to-use#framework-integration)
- This release is a bit radical – but it lays the foundation for a cleaner, framework-agnostic future._

### Removed
- > 🔥 BREAKING CHANGES: templUI is now completely framework-agnostic! Works seamlessly with HTMX, Datastar, or any hypermedia framework.
- Remove HTMX-specific props from components (HxGet, HxPost, etc.) - use `templ.Attributes` instead for maximum flexibility
- _Note: Since templUI is pre-v1.0, I'm intentionally moving fast and breaking things to get the architecture right. That means: yes, there might be bugs – and they’ll get fixed fast. If anything broke for you because of this change: sorry! Let me know and I’ll patch it ASAP.

### Fixed
- No changes to the codebase – just fixing version mismatch from v0.80.0/v0.80.1.
- Fix form component docs: Fixed select box href typo _(thanks @jaingounchained)_ (thanks @jaingounchained for documentation fixes)

## [v0.80.1] - 2025-06-23

### Added
- Complete framework decoupling - templUI components now expose clean `window.templUI.*` APIs instead of hardcoded HTMX event listeners
- Add comprehensive framework integration documentation with examples for HTMX, Datastar, and manual initialization
- Add Gopher mascot image and enhance features section with detailed framework-agnostic benefits
- Enhance 'How To Use' documentation with structured sections and detailed integration guides
- Add performance notes explaining HTMX vs Datastar trade-offs (targeted vs global re-initialization)
- Add submenus to documentation navigation for better discoverability
- 📈 Better Performance: Targeted re-initialization where supported (HTMX)

### Changed
- 🛠️ Patch Note
- This is a version bump release to sync the internal version with the actual tag.
- If you're using go install, make sure to use v0.80.1.
- Improve ESLint configuration for JavaScript files for better development experience
- Clean component APIs - all components now follow consistent `initAllComponents(root)` pattern
- 🎯 Framework Agnostic: Works with HTMX, Datastar, Alpine.js, or any framework
- 🔮 Future Proof: Ready for whatever hypermedia framework comes next
- 🧹 Cleaner APIs: Consistent component interfaces across the board
- 🧪 Easier Testing: No framework dependencies in component code
- 🚀 Broader Adoption: Not tied to specific ecosystems (thanks everyone who provided feedback on [RFC discussion](https://github.com/axzilla/templui/discussions/251); thanks @vague2k for honest developer experience perspective; thanks @delaneyj (Datastar author) for collaboration insights; thanks @chris-perardi for startup use case validation; thanks @glsubri for thoughtful component API feedback)
- This change represents templUI's evolution from an HTMX-focused library to a truly universal Go/templ component system! 🎉
- 📖 Migration Guide: [Framework Integration Docs](https://templui.io/docs/how-to-use#framework-integration)
- This release is a bit radical – but it lays the foundation for a cleaner, framework-agnostic future._

### Removed
- > 🔥 BREAKING CHANGES: templUI is now completely framework-agnostic! Works seamlessly with HTMX, Datastar, or any hypermedia framework.
- Remove HTMX-specific props from components (HxGet, HxPost, etc.) - use `templ.Attributes` instead for maximum flexibility
- _Note: Since templUI is pre-v1.0, I'm intentionally moving fast and breaking things to get the architecture right. That means: yes, there might be bugs – and they’ll get fixed fast. If anything broke for you because of this change: sorry! Let me know and I’ll patch it ASAP.

### Fixed
- No changes to the codebase – just fixing version mismatch from v0.80.0.
- Fix form component docs: Fixed select box href typo _(thanks @jaingounchained)_ (thanks @jaingounchained for documentation fixes)

## [v0.80.0] - 2025-06-23

### Added
- Complete framework decoupling - templUI components now expose clean `window.templUI.*` APIs instead of hardcoded HTMX event listeners
- Add comprehensive framework integration documentation with examples for HTMX, Datastar, and manual initialization
- Add Gopher mascot image and enhance features section with detailed framework-agnostic benefits
- Enhance 'How To Use' documentation with structured sections and detailed integration guides
- Add performance notes explaining HTMX vs Datastar trade-offs (targeted vs global re-initialization)
- Add submenus to documentation navigation for better discoverability
- 📈 Better Performance: Targeted re-initialization where supported (HTMX)

### Changed
- Improve ESLint configuration for JavaScript files for better development experience
- Clean component APIs - all components now follow consistent `initAllComponents(root)` pattern
- 🎯 Framework Agnostic: Works with HTMX, Datastar, Alpine.js, or any framework
- 🔮 Future Proof: Ready for whatever hypermedia framework comes next
- 🧹 Cleaner APIs: Consistent component interfaces across the board
- 🧪 Easier Testing: No framework dependencies in component code
- 🚀 Broader Adoption: Not tied to specific ecosystems (thanks everyone who provided feedback on [RFC discussion](https://github.com/axzilla/templui/discussions/251); thanks @vague2k for honest developer experience perspective; thanks @delaneyj (Datastar author) for collaboration insights; thanks @chris-perardi for startup use case validation; thanks @glsubri for thoughtful component API feedback)
- This change represents templUI's evolution from an HTMX-focused library to a truly universal Go/templ component system! 🎉
- 📖 Migration Guide: [Framework Integration Docs](https://templui.io/docs/how-to-use#framework-integration)
- This release is a bit radical – but it lays the foundation for a cleaner, framework-agnostic future._

### Removed
- > 🔥 BREAKING CHANGES: templUI is now completely framework-agnostic! Works seamlessly with HTMX, Datastar, or any hypermedia framework.
- Remove HTMX-specific props from components (HxGet, HxPost, etc.) - use `templ.Attributes` instead for maximum flexibility
- _Note: Since templUI is pre-v1.0, I'm intentionally moving fast and breaking things to get the architecture right. That means: yes, there might be bugs – and they’ll get fixed fast. If anything broke for you because of this change: sorry! Let me know and I’ll patch it ASAP.

### Fixed
- Fix form component docs: Fixed select box href typo _(thanks @jaingounchained)_ (thanks @jaingounchained for documentation fixes)

## [v0.75.7] - 2025-06-21

### Changed
- Patch release to ensure latest commit is correctly tagged with `v0.75.7`
- *(No code changes – just syncing up the tag with the actual state of `main`)*

### Fixed
- > 🧩 Meta fix for tag consistency

## [v0.75.6] - 2025-06-21

### Fixed
- > 🛠️ Small fixes for popover logic and modal rendering
- Prevent multiple `popover` components from staying open at the same time
- Correct `class` attribute for modal container to avoid unexpected styling issues

## [v0.75.5] - 2025-06-21

### Added
- Add `readonly` attribute to the `textarea` component *(thanks @ArturC03)*
- Add `Initial` open state for `Drawer` component – useful for SSR and conditional rendering
- Add `Initial` open state for `Modal` component to allow default-open behavior without JS triggers
- Add `PreventClose` prop to `dropdown.Item()` – allows triggering nested components like `Drawer` without closing the dropdown

### Changed
- > ✨ Quality-of-life improvements for Modal, Drawer, Dropdown and Textarea components

### Removed
- Remove unused `meta.json` file (minor internal cleanup)

## [v0.75.4] - 2025-06-15

### Changed
- Updated minimum Templ version requirement to `v0.3.898`
- Recommended to update: `go install github.com/a-h/templ/cmd/templ@latest`

### Removed
- *This patch ensures seamless upgrades from v0.74.x without breaking existing configurations.*

### Fixed
- > 🐛 Critical fix for JSPublicPath configuration and CLI compatibility
- Resolved JSPublicPath configuration issues causing component Script() failures *(thanks @vague2k)*:
- Fixed automatic fallback for missing `jsPublicPath` in existing configurations
- Prevents 404 errors and MIME type issues when loading component JavaScript files
- Ensures backward compatibility with v0.74.x configurations
- Affects all JS-enabled components: rating, modal, selectbox, dropdown, carousel, etc.
- Resolves "text/plain" MIME type errors in browser console
- Ensures compatibility with latest Templ features and fixes

## [v0.75.3] - 2025-06-14

### Fixed
- > 🐛 Critical HTMX swap fix for component reinitialization across all swap scenarios
- Resolved component reinitialization issues after HTMX swaps *(thanks @CarraraVitor)*:
- Fixed event target selection for normal vs OOB swaps
- Normal swaps now correctly use `event.detail.elt` (newly inserted element)
- OOB swaps now correctly use `event.detail.target` (target element)
- Affects all JS-enabled components: rating, modal, selectbox, dropdown, etc.
- Resolves conflicts from previous fixes in,,
- *This patch ensures components work correctly after all HTMX swap operations.*

## [v0.75.2] - 2025-06-13

### Added
- Massive upgrade to `SelectBox` component with advanced interaction support *(thanks @derkan)*:
- 🔍 Client-side search by default (disable with `ContentProps.NoSearch = true`)
- ✅ Multiple selection support (`TriggerProps.Multiple = true`)
- 💊 Pill-style display for selected items (`TriggerProps.ShowPills = true`)
- 🔄 HTMX support for dynamic/cascading selects via.
- `HxTrigger`, `HxTarget`, `HxSwap`, `HxReplaceUrl`
- 🧠 Custom `SelectedCountText` and `SearchPlaceholder` support
- Added support for `hx-indicator` prop – allows built-in loading indicators for HTMX interactions. *(thanks @glsubri)*
- Added `jsPublicPath` support to `.templui.json` – allows separation between on-disk JS location (`jsDir`) and browser-facing path (`jsPublicPath`) for flexible server setups and sub-path deployments. *(thanks @manicar2093)*
- Updated to latest Templ version `v0.3.898`
- *This release focuses on power-user features: smarter SelectBoxes, better form behavior, and flexible JS delivery for complex setups.*

### Changed
- > 🔁 Patch release to bump CLI version correctly (was missing in v0.75.0/v0.75.1)

### Removed
- Removed typo in radio card drawer menu URL – resolved malformed `nospace` anchor reference.
- `HxGet`, `HxPost`, `HxPut`, `HxDelete`

### Fixed
- > No code changes – same as `v0.75.0/v0.75.1`, just fixing version sync.
- Added source code links in documentation – enables quick access to GitHub source for easier copy-paste and deeper exploration.
- Changed form submission behavior from `""/on` to `false/true` for checkbox and toggle components – enables consistent boolean handling in Go forms. *(thanks @manicar2093)*

## [v0.75.1] - 2025-06-13

### Added
- Massive upgrade to `SelectBox` component with advanced interaction support *(thanks @derkan)*:
- 🔍 Client-side search by default (disable with `ContentProps.NoSearch = true`)
- ✅ Multiple selection support (`TriggerProps.Multiple = true`)
- 💊 Pill-style display for selected items (`TriggerProps.ShowPills = true`)
- 🔄 HTMX support for dynamic/cascading selects via.
- `HxTrigger`, `HxTarget`, `HxSwap`, `HxReplaceUrl`
- 🧠 Custom `SelectedCountText` and `SearchPlaceholder` support
- Added support for `hx-indicator` prop – allows built-in loading indicators for HTMX interactions. *(thanks @glsubri)*
- Added `jsPublicPath` support to `.templui.json` – allows separation between on-disk JS location (`jsDir`) and browser-facing path (`jsPublicPath`) for flexible server setups and sub-path deployments. *(thanks @manicar2093)*
- Updated to latest Templ version `v0.3.898`
- *This release focuses on power-user features: smarter SelectBoxes, better form behavior, and flexible JS delivery for complex setups.*

### Changed
- > 🔁 Patch release to bump CLI version correctly (was missing in v0.75.0)

### Removed
- Removed typo in radio card drawer menu URL – resolved malformed `nospace` anchor reference.
- `HxGet`, `HxPost`, `HxPut`, `HxDelete`

### Fixed
- > No code changes – same as `v0.75.0`, just fixing version sync.
- Added source code links in documentation – enables quick access to GitHub source for easier copy-paste and deeper exploration.
- Changed form submission behavior from `""/on` to `false/true` for checkbox and toggle components – enables consistent boolean handling in Go forms. *(thanks @manicar2093)*

## [v0.75.0] - 2025-06-13

### Added
- Massive upgrade to `SelectBox` component with advanced interaction support *(thanks @derkan)*:
- 🔍 Client-side search by default (disable with `ContentProps.NoSearch = true`)
- ✅ Multiple selection support (`TriggerProps.Multiple = true`)
- 💊 Pill-style display for selected items (`TriggerProps.ShowPills = true`)
- 🔄 HTMX support for dynamic/cascading selects via.
- `HxTrigger`, `HxTarget`, `HxSwap`, `HxReplaceUrl`
- 🧠 Custom `SelectedCountText` and `SearchPlaceholder` support
- Added support for `hx-indicator` prop – allows built-in loading indicators for HTMX interactions. *(thanks @glsubri)*
- Added `jsPublicPath` support to `.templui.json` – allows separation between on-disk JS location (`jsDir`) and browser-facing path (`jsPublicPath`) for flexible server setups and sub-path deployments. *(thanks @manicar2093)*
- Updated to latest Templ version `v0.3.898`
- *This release focuses on power-user features: smarter SelectBoxes, better form behavior, and flexible JS delivery for complex setups.*

### Removed
- Removed typo in radio card drawer menu URL – resolved malformed `nospace` anchor reference.
- `HxGet`, `HxPost`, `HxPut`, `HxDelete`

### Fixed
- Added source code links in documentation – enables quick access to GitHub source for easier copy-paste and deeper exploration.
- Changed form submission behavior from `""/on` to `false/true` for checkbox and toggle components – enables consistent boolean handling in Go forms. *(thanks @manicar2093)*

## [v0.74.2] - 2025-06-03

### Added
- Enhanced `loadConfig()` function with comprehensive validation – clean separation of concerns between loading and creating configs.
- Added config repair functionality to `init --force` command – automatically detects and prompts for missing configuration fields.
- Improved user experience with structured error messages using icons (🚫, ❌, 📋, 🔧, 🚀) – makes CLI output more readable and user-friendly.
- Enhanced help documentation with clear flag syntax examples – better guidance for users on correct command usage.
- *All about better CLI experience, clearer error messages, and smoother configuration management.*

### Fixed
- Enhanced error message formatting with icons and multi-line display – improved user experience when config files are missing or incomplete.
- Added validation for `jsDir` field in config validation – ensures complete configuration setup for JavaScript components.
- Corrected flag syntax documentation – help now correctly shows `templui -f init` instead of `templui init -f`.
- Improved config repair functionality with better error messaging – users get clear, actionable guidance when configuration is incomplete.

## [v0.74.1] - 2025-06-02

### Fixed
- Forgot to bump the version number in the source code for v0.74.0 – now correctly set to `v0.74.1`.
- *No other changes – just version hygiene.*

## [v0.74.0] - 2025-06-02

### Added
- Install requirements now include direct clickable links to all needed tools and dependencies – no more hunting around.
- *All about consistency, clarity and smoother DX.*

### Removed
- Removed unnecessary Tailwind `ring` from the `IconButton` – it was clipping and visually redundant.

### Fixed
- Updated usage instructions for JavaScript components in the `how_to_use` template – corrected outdated or misleading guidance.
- Added support for the `name` attribute in the `SelectBox` component – now consistent with other form elements and supports manual setting.
- fix/docs: Display required JS script dependencies next to each component in the docs – helpful for components like `DatePicker`, `Dropdown`, etc., which rely on `@popover.Script()` as well.
- Introduced issue templates – users are now guided to provide more useful context, making it easier to debug and improve things.

## [v0.73.2] - 2025-05-29

### Added
- *No new features. Just clean and working as it should.*

### Fixed
- Newly added JS files were missing from the Go binary – fixed by properly embedding them via `go:embed`.
- Recompiled all component JS files via esbuild – now correctly reflects latest HTMX `swap-target` adjustments present in the source code.

## [v0.73.1] - 2025-05-29

### Added
- JavaScript logic is now decoupled from `.templ` files and moved into standalone minified JS files – better DX with proper syntax highlighting, LSP support, and editor IntelliSense.
- → Component JS is now globally injected via layout – improves HTMX support and overall performance.

### Changed
- CLI output is now 🌈 cleaner and more readable – includes emojis, better component listing with short descriptions and JS requirements.
- Improved documentation for component setup and installation – clearer, leaner, and more actionable.

### Removed
- Removed some unused, uncommented code 🧹.

### Fixed
- CLI now correctly displays the version number (previously a duplicate `vv...` typo).

## [v0.73.0] - 2025-05-29

### Added
- JavaScript logic is now decoupled from `.templ` files and moved into standalone minified JS files – better DX with proper syntax highlighting, LSP support, and editor IntelliSense.
- → Component JS is now globally injected via layout – improves HTMX support and overall performance.

### Changed
- CLI output is now 🌈 cleaner and more readable – includes emojis, better component listing with short descriptions and JS requirements.
- Improved documentation for component setup and installation – clearer, leaner, and more actionable.

### Removed
- Removed some unused, uncommented code 🧹.

### Fixed
- CLI now correctly displays the version number (previously a duplicate `vv...` typo).

## [v0.72.1] - 2025-05-27

### Fixed
- Updated internal CLI version string to correctly reflect `v0.72.1`.
- Initials generator now supports non-ASCII characters (e.g. emojis, umlauts, etc.) (thanks @gektus)
- *No other functional changes.*

## [v0.72.0] - 2025-05-27

### Changed
- Replaced `math/rand` with `crypto/rand` in `RandomID()` – more secure and future-proof (thanks @JamesSlocumIH)

### Fixed
- `-h` and `-v` flags now work as expected and correctly display help and version info (thanks @Gad)
- Toasts now use the correct background and text colors regardless of the current theme.
- HTMX swaps now use `target` instead of `elt` – ensuring proper behavior for OOB swaps (thanks @gektus)

## [v0.71.0] - 2025-05-16

### Added
- Replaced external CDN with a locally bundled version of FloatingUI for better reliability and offline support.

### Fixed
- Popovers now use a shared global portal instead of each having its own. This resolves conflicts when multiple popovers or components using popovers were interfering with each other.

## [v0.70.0] - 2025-05-14

### Added
- This is a major release introducing a fundamental shift: templUI is now CLI-first!
- We're thrilled to launch the new `templui` command-line interface! This tool is now the official way to manage templUI components, simplifying installation, versioning, and updates.
- Key Benefits.
- Simplified Management: Add components directly from your terminal.
- Clear Versioning: Fetch components using specific Git refs (tags, branches, commits).
- Direct Integration: Components are installed into your project, giving you full ownership.
- Automatic Path Handling: The CLI adjusts import paths to fit your project structure (defined in `.templui.json`).
- Quick Start.
- *(Ensure Go `bin` is in your PATH)*
- (Creates `.templui.json` and installs utils)
- (Specify versions with `add@<ref> <component>`)
- How Updates Work.
- Re-run `templui add <component-name>[@<ref>]` to update.
- The CLI checks your local file's version. If an update is available, it will prompt to overwrite (unless `--force` is used).
- Important: Manual changes to component files will be lost if overwritten by an update. This is by design, similar to `shadcn/ui`.
- Input OTP: Added `Autofocus` attribute. (Thanks @derkan!)
- Pagination: Customizable "Previous" / "Next" labels. (Thanks @derkan!)
- Popover Showcase: Improved example layouts.
- If you're new to templUI or were using a pre-release CLI version, run.
- Add components as needed using the CLI.
- The `templui` Go module is no longer the primary way to consume components; all component management is now handled through the CLI. We're excited for you to use the new CLI and look forward to your feedback!

### Changed
- Initialize (or re-initialize) in your project.
- This ensures your project is set up with the latest configuration logic.

### Fixed
- Corrected Import Path Logic: The CLI now reliably uses `componentsDir` and `utilsDir` from `.templui.json` for all path rewriting.
- Typos: Various typographical errors corrected. (Thanks @eryk-vieira!)

## [v0.64.0] - 2025-05-08

### Fixed
- HTMX Swap Initialization: Resolved an issue where JavaScript for components (like SelectBox, Popover, etc.) was not reliably re-initialized after certain HTMX swap operations (e.g., `outerHTML`, `beforebegin`). This ensures components are fully interactive after dynamic content updates. Big thanks @derkan for the extensive debugging and collaboration on this!
- Calendar Localization: The Calendar component now correctly displays localized month names according to the provided `localeTag`, using `Intl.DateTimeFormat`. This fixes an issue where only English month names were previously shown.

## [v0.63.0] - 2025-05-07

### Added
- replace setTimeout with requestAnimationFrame in component …

## [v0.62.0] - 2025-05-06

### Added
- Added TailwindCSS linter to enforce consistent styling practices across the codebase, including the `no-style-attribute` rule.
- Added support for color arrays in charts, allowing customized coloring for individual data values.

### Changed
- Improved HTML quality and standardized styling approaches to ensure native Tailwind usage throughout the codebase.
- Implemented visibility toggle functionality for password inputs, improving user experience.
- Refactored Dropdown and SelectBox components to use the Popover system for better positioning consistency.
- Popover component now handles all positioning logic to prevent clipping issues across various contexts.
- Dependencies: Upgraded to templ v0.3.856.
- Code Cleanup: Standardized component styling by removing inline style attributes in favor of Tailwind utility classes.

### Removed
- Toast Positioning: Removed double offset calculation that was causing toast notifications to appear in incorrect positions.

### Fixed
- Calendar/DatePicker: Fixed a critical timezone issue that was causing a 30-day offset in certain timezone configurations.
- Development Workflow: Resolved an issue with the order of `make dev` commands that prevented TailwindCSS from generating CSS files on-the-fly on certain operating systems.
- Chart Tooltips: Fixed inconsistencies where chart tooltips occasionally displayed incorrect labels.

## [v0.61.0] - 2025-04-30

### Added
- Implemented handling for `htmx:oobAfterSwap` events across all relevant components. This ensures components are correctly initialized even when added to the page via Out-of-Band swaps, further improving dynamic update reliability.

### Changed
- Standardized the JavaScript initialization pattern (`initAllComponents`, `handleHtmxSwap`) across all components for better consistency and maintainability.
- Robust Initialization Logic: Refined the component initialization process to better handle edge cases and dependencies (e.g., waiting for external libraries like Chart.js, highlight.js, Floating UI before initialization).
- Code Consistency: Applied the standardized initialization pattern throughout the component JavaScript code.
- While compatibility with HTMX swaps (including OOB) has been significantly enhanced, complex dynamic updates might still reveal edge cases. Please report any unexpected behavior via GitHub issues.

### Removed
- Code Cleanup: Removed redundant checks (e.g., `readyState`) and improved code structure within component scripts.

### Fixed
- Popover: Fixed an issue where popovers might not close correctly after multiple HTMX swaps due to inconsistent state management or listener handling during re-initialization.
- Initialization Errors: Addressed potential TypeErrors during initialization (e.g., in Calendar) caused by incorrect handling of the `DOMContentLoaded` event argument.
- General Stability: Improved the reliability of component initialization, especially in dynamic environments involving HTMX swaps.

## [v0.60.0] - 2025-04-24

### Added
- HTMX Swap Compatibility: All components are now fully compatible with HTMX swaps, ensuring seamless dynamic updates.

### Changed
- Separated the calendar into its own reusable component.
- Simplified and improved the API for both the datepicker and calendar.
- Leveraged native JavaScript Date and locale internals for better browser compatibility.
- Reduced code complexity: Vanilla JS implementations resulted in fewer lines of code compared to Alpine.js.
- Cleaned up and optimized JavaScript across all components.
- While all components are now HTMX swap compatible, there may still be edge cases where swaps don't behave as expected due to the complexity of dynamic updates. If you encounter any issues, please report them ASAP by opening an issue on GitHub. Your feedback is invaluable!

### Removed
- Vanilla JS Migration: Completely removed Alpine.js from the core library and rewrote all components in vanilla JavaScript for better performance, simplicity, and maintainability.
- Removed all Alpine.js dependencies from the codebase.

### Fixed
- Fixed various quirks and issues related to Alpine.js and HTMX swaps.
- Improved component stability and browser compatibility.

## [v0.53.1] - 2025-04-19

### Fixed
- Replaced static `Avatar` fallback with dynamic JS fallback logic: avatars now automatically show initials if the image fails to load
- Improved reliability by checking `image.complete` and `naturalWidth` and reacting to load/error events

## [v0.53.0] - 2025-04-16

### Added
- Added Shiki for code syntax highlighting (replacing highlight.js)
- Added Docker support with Dockerfile and docker-compose.yml
- Better code highlighting with theme support

### Changed
- Simplified Separator component by removing Label prop
- Updated code snippets to use consistent modules.Code component
- Code cleanup throughout the codebase

### Removed
- Removed unused button props on landing page
- Removed unnecessary separator component from DocsLayout

### Fixed
- Fixed incorrect container style in input.css
- Resolved HTML linting issues for improved accessibility (thanks @DianaSuvorova)

## [v0.52.0] - 2025-04-13

### Added
- introduce html eslint for more semantic html/seo on components and showcases (big thanks @DianaSuvorova )

### Changed
- This PR comes with several changes.
- Improves accessibility and SEO
- Standardizes HTML structure
- Catches common semantic issues
- show version number in navbar
- Better styling and wording on landing page/navbar/footer

### Removed
- remove tailwind output css from repo and use it only in build to remove compatibility issues as an OSS project

## [v0.51.0] - 2025-04-12

### Added
- add button types enum instead of strings for improved type safety
- add table of contents in right sidebar
- add breadcrumbs for better document hierarchy

### Changed
- This PR comes with several changes.
- bump templ dependency to v0.3.857
- improve documentation layout with cleaner design

## [v0.50.0] - 2025-04-09

### Changed
- This release represents a significant milestone on our path to v1.0 with a complete restructuring of the component architecture.
- Clearer component dependencies
- Better compatibility with future CLI tooling
- Improved structure for copy-paste component usage
- More idiomatic Go package organization
- Due to the extensive restructuring, imports need to be updated. Example.
- This significant version bump (0.44 → 0.50) reflects the magnitude of the changes and our progress toward a stable v1.0 release.

### Removed
- Complete package restructuring: Components are now in their own packages
- Before: `import "github.com/axzilla/templui/components"`
- Now: `import "github.com/axzilla/templui/component/button"`
- Component function naming: Changed for consistency and idiomaticity
- Before: `components.Button(components.ButtonProps{...})`
- Now: `button.Button(button.Props{...})`
- Package naming: All packages renamed to singular form to match Go idioms

## [v0.44.0] - 2025-04-08

### Changed
- This PR comes with several changes.
- clean up some empty prop structs

### Fixed
- check for native label to avoid console errors
- use 'Popover' now under the hood to fix z-index and overflow issues
- update launch.json to bring back debugger functionality

## [v0.43.0] - 2025-03-29

### Added
- This PR adds a new component.
- add 'Popover' component (shoutout to @derkan)

## [v0.42.0] - 2025-03-27

### Added
- change to button with hidden input approach
- add click event listener for labels

### Changed
- This PR restores broken label connectivity for custom form components such as OTP, Date Picker, and Select.

### Removed
- remove unnecessary JS code

### Fixed
- bring back focus on custom form elements

## [v0.41.0] - 2025-03-24

### Added
- Introduced variadic functions for components and icons with integer size parameters
- Enhanced developer ergonomics with reduced boilerplate and smarter defaults

### Changed
- Improved developer experience with a more intuitive component API and cleaner HTML output.
- Improved code readability while maintaining full functionality

### Fixed
- Optimized DOM by conditionally rendering attributes and preventing empty values

## [v0.40.0] - 2025-03-21

### Added
- use enums instead of raw strings for component configuration
- add new component: Table (shoutout to @niclimcy)
- Added Modal Closing Control Options.
- replace Alpinejs with vanillajs
- add tailwind ring when button is active
- better API and showcase
- add base props (id, class, attributes) to every component for better customization
- rename prop TooltipSide to TooltipPosition
- has cursor pointer now
- add avatar group and improve showcase examples
- add examples for Form and Label on all form related components now
- add labels and improve showcase examples

### Changed
- This is my biggest release so far with many changes! It's mainly about converting all components where possible and sensible to component composition for better customization, accessibility, and so on - you know what I mean! Also, this is another big step towards v1.0!
- rename Sheet component to Drawer for more semantic naming
- improve showcase for htmx loading button example with native tailwindcss instead of additional css script
- global renaming from Type to Variant for config props on all components to be more "semantic"
- better internal file structure and naming
- use component composition style instead of content passing via props on: Accordion, Avatar, Badge, Breadcrumb, Button (can now be disabled even with Href prop), Tooltip, dropdown menu (generally improved with scrolling), Pagination, Select, Label, Carousel, Form, Drawer, Input OTP, Radio Card, Checkbox Card, Rating, Slider (also use vanilla instead of Alpinejs), Tabs
- DisableClickAway: Prevents modal from closing when clicking outside
- DisableESC: Prevents modal from closing when pressing ESC key
- (shoutout to @derkan)
- change navbar and announcmentbar style
- sort alphabetically
- better utils comments
- better sorting for consistency and readability: types, templ components, scripts, functions and methods
- rename TwIf and TfIfElse to If and IfElse and make them more generic
- more semantic showcase example titles
- Form and Label showcase links are now complete and alphabetically sorted
- use string enums instead of iota in all components now

### Removed
- remove all comments from component structure to have cleaner and more readable code
- big update on almost all components (Attention many breaking changes!) and improve docs showcases:
- remove it for now because of compatibility problems
- remove unnecessary Text prop
- remove postfix on some components, removed the word Root on base components

### Fixed
- use correct charts.js cdn to avoid browser console errors

## [v0.39.0] - 2025-03-14

### Added
- bump to newest Lucide version
- add stroke width props
- add htmx-replace-url props

### Changed
- change origin file location from local to remote

### Fixed
- use correct Air URL

## [v0.38.0] - 2025-03-10

### Added
- add 'Rating' component
- add 'Separator' component
- add 'Spinner' component
- add 'Skeleton' component
- add 'Progress' component
- use new spinner component on HTMX showcase example

## [v0.37.0] - 2025-03-09

### Added
- add 'Input OTP' component
- improve design of form components

### Changed
- implement onsite SEO

## [v0.36.0] - 2025-03-07

### Added
- add 'Pagination' component
- add basic htmx attributes

## [v0.35.0] - 2025-03-06

### Added
- add 'Carousel' component
- add 'Chart' component

## [v0.34.0] - 2025-03-02

### Added
- add 'Breadcrumb' component
- add 'Checkbox Card' component
- add 'Radio Card' component

## [v0.33.0] - 2025-03-01

### Added
- add aspect ratio component
- make it mobile responsive

## [v0.32.0] - 2025-02-28

### Added
- add templUI Pro announcement
- add HTMX loading spinner showcase example
- You'll need to update all your import statements to reflect this new structure

### Changed
- simplified implementations by removing JS in favor of CSS-only solutions for tooltip and accordion components

### Removed
- improved backdrop with smoother aesthetics
- removed pkg folder from library root to adopt a more "Go-idiomatic" architecture
- All import paths have changed from `github.com/axzilla/templui/pkg/...` to `github.com/axzilla/templui/...`

## [v0.31.0] - 2025-02-22

### Changed
- change brand identity, title and subtitle
- improve layout layout (more clean and readable)

### Removed
- remove JS on accordion and tooltip component (part of a larger upcoming update)

### Fixed
- bring back theme builder functionality
- bring back missing values in tailwind base config

## [v0.30.0] - 2025-02-13

### Added
- add required attribute support for form components (input, textarea, select, checkbox, radio)
- active state for sidebar navigation (highlights current page)
- new simplified documentation structure
- change: new TemplUI slogan and branding
- improve: external links now open in new tab
- improve: add missing component code tabs (form & label components)
- add: GitHub Sponsors support with badges

### Changed
- upgrade: move to Tailwind CSS v4.x with CSS-only configuration
- improve: all external assets now served locally (including logos)
- improve: simplify "How to Use" documentation
- improved documentation structure
- Special shoutout to @landrade and @zyriab - your contributions made this release possible! 🙌

### Removed
- remove unnecessary code

### Fixed
- repair broken Tailwind logo in docs sidebar
- various documentation typos
- update to latest templ version

### Security
- change: switch from CSP-first to standard approach in documentation

## [v0.29.2] - 2025-01-30

### Fixed
- shift blankdays by 1 to show correct days (shoutout to @RImJur)

## [v0.29.1] - 2025-01-20

### Fixed
- make clipboard copy function available in http environments besides https and localhost

## [v0.29.0] - 2025-01-11

### Added
- add timepicker

## [v0.28.3] - 2025-01-10

### Added
- upgrade templ and update docs for new Go > 1.23 requirements

### Fixed
- initialize custom language config now correctly

## [v0.28.2] - 2024-12-29

### Fixed
- disable bfbrowser cache to avoid unnecessary js/html states
- make code component self contained with highlight.js stuff to avoid initial page flicker
- change first active tab behaviour to avoid initial page flicker

## [v0.28.1] - 2024-12-28

### Fixed
- provide value attribute only if its set

## [v0.28.0] - 2024-12-23

### Added
- add Code component

## [v0.27.1] - 2024-12-22

### Changed
- rename 'internals' to 'internal' across the codebase

## [v0.27.0] - 2024-12-21

### Added
- add tooltip component 🚀

## [v0.26.1] - 2024-12-19

### Added
- Simplified configuration for better developer experience

### Removed
- 🔄 Removed unnecessary style-src configurations

### Security
- ⚡️ Optimized CSP middleware to focus on script-src directives
- 🛡️ Improved CSP documentation clarity
- CSP middleware now focuses solely on script source security
- Updated documentation with clearer CSP implementation guidelines

## [v0.26.0] - 2024-12-18

### Added
- New Dockerfile for easy deployment

### Changed
- 🔄 Standardized Alpine.js integration
- 📦 Improved component script management
- 📚 Enhanced documentation
- Standardized script handling across components
- Improved error handling and feedback
- Enhanced accessibility
- Improved development setup
- Comprehensive FAQ section
- Ready-to-use project structure

### Security
- ⚡️ CSP-compliant architecture by default
- 🛡️ New CSP middleware for advanced security needs
- All interactive components now CSP-compliant

## [v0.25.0] - 2024-12-12

### Added
- add toast 🍞 component 🚀

### Changed
- For all other recent changes, see the commit history.

## [v0.24.0] - 2024-12-11

### Added
- 📦 New import path: github.com/axzilla/templui
- 🏠 New website: templui.io

### Changed
- 🎉 Rebranded from Goilerplate to templUI
- For all other recent changes, see the commit history.
- Note: This release includes the repository rename from goilerplate to templui. Please update your imports accordingly.

## [v0.23.0] - 2024-12-09

### Added
- Improved documentation and Quickstart guide with a new no-Node.js setup option.
- Introduced dedicated Label, Description, and Message components for clearer composition, better accessibility, and cleaner markup.
- Support for custom placeholders, formatting options, and disabled states.
- Restored and improved theme preview functionality aligned with the new component structure.

### Changed
- Docs & Setup.
- Updated instructions for integrating Tailwind and Alpine.js directly via CDN for a cleaner, more native approach.
- Enhanced theme configuration docs and improved clarity around component usage.
- Form Components & Accessibility.
- Major overhaul of form components (Checkbox, Datepicker, Input, Radio, Select, Textarea, Toggle) with improved state handling via attributes and Go props.
- More comprehensive showcase examples with properly set IDs, names, values, and enhanced accessibility.
- Datepicker Enhancements.
- Updated showcase examples for easier understanding.
- UI & Icons.
- Modernized navbar icons for GitHub and X.com.
- Theme Preview & Compatibility.
- Refactoring & Chores.
- Updated templ-generated files to templ: version v0.2.793.
- For all other recent changes, see the commit history.

### Removed
- Standardized comments, removed unused code, and modularized showcase code.

### Fixed
- Fixed compatibility issues with Go < 1.23.

## [v0.22.1] - 2024-11-25

### Changed
- For all other recent changes, see the commit history.

### Fixed
- hotfix: Make datepicker work again

## [v0.22.0] - 2024-11-22

### Added
- Add new Textarea and Slider components
- Better Alpine.js x-model attribute support

### Changed
- change: Simplify and improve base layout wrapper for better theme switching readability
- change: Enhance form components (Toggle, Checkbox, RadioGroup, Input, Datepicker, Select) with:
- More native HTML/Tailwind implementation
- Improved accessibility
- Simplified UI structure
- change: Standardize component documentation style across library for better readability
- improve: Clean up codebase by removing unused code and redundant comments
- For all other recent changes, see the commit history.
- Note: This release focuses on improving component consistency, accessibility and Alpine.js integration while simplifying the overall codebase structure. All form components now work seamlessly with Alpine.js x-model attribute for better state management.

### Removed
- change: Remove unnecessary Cheatsheet.md file

## [v0.21.1] - 2024-10-26

### Changed
- For all other recent changes, see the commit history.

### Fixed
- Implement tailwind-merge-go to avoid class conflicts and allow overwrites

## [v0.21.0] - 2024-10-25

### Added
- Feature: Add toggle component
- Improve: Add radio buttons to theme preview
- Improve: Add toggle to theme preview

### Changed
- Improve: Link input.css as reference
- For all other recent changes, see the commit history.

### Removed
- Make checkbox work again, use conditional JS/Alpine.js strings and remove Go bools on checked and disabled states
- Change: Remove all related Product Hunt badges across the project

### Fixed
- Correct the placement for the icon label showcase

## [v0.20.8] - 2024-10-18

### Added
- Feature: Add radio group component

### Changed
- For all other recent changes, see the commit history.

### Removed
- Remove unnecessary checkbox showcase example

### Fixed
- Checked/disabled checkboxes are now shown correctly
- Include js/* into Assets embed to use use it for the theme docs

## [v0.20.7] - 2024-10-13

### Added
- Feature: Add themes section to docs

### Changed
- Change: Create a great theme preview
- Improvement: Cleaner UI on getting started sections
- For all other recent changes, see the commit history.

### Fixed
- Improve Datepicker smooth positioning
- Resolve Checkbox check icon always visible issue
- Correct typos and URL name issues

## [v0.20.6] - 2024-10-12

### Changed
- Goilerplate v0.20.6
- For all other recent changes, see the commit history.

### Fixed
- Hotfix: fix colors on checkbox component

## [v0.20.5] - 2024-10-12

### Changed
- Goilerplate v0.20.5
- For all other recent changes, see the commit history.

### Fixed
- Library css makefile hotfix

## [v0.20.4] - 2024-10-12

### Added
- Added checkbox component

### Changed
- Goilerplate v0.20.4
- For all other recent changes, see the commit history.

## [v0.20.3] - 2024-10-11

### Added
- Added dropdown menu component
- Added link to Lucide in documentation

### Changed
- Goilerplate v0.20.3
- Improved icon implementation and documentation
- Implemented icon names as constants for autocomplete
- Optimized icon storage for more efficient resource usage
- For all other recent changes, see the commit history.

### Fixed
- Patch release to fix package content discrepancy.
- Corrected package content to match the latest changes

## [v0.20.2] - 2024-10-11

### Added
- Added dropdown menu component
- Added link to Lucide in documentation

### Changed
- Improved icon implementation and documentation
- Implemented icon names as constants for autocomplete
- Optimized icon storage for more efficient resource usage
- For all other recent changes, see the commit history.

## [v0.20.1] - 2024-10-10

### Changed
- Separate CSS for library components
- Refactored icon component to use custom implementation
- For all other recent changes, see the commit history.

### Fixed
- Fixed dark mode issues in Datepicker
- Corrected URL typo

## [v0.20.0] - 2024-10-09

### Added
- This is the first official GitHub release of Goilerplate. Previous versions (0.1.0 and 0.1.1) were internal development versions. This release marks a significant milestone in the project's development, introducing several new components and improvements.
- Avatar component
- Lucide icon wrapper component
- Input component
- Modal component
- Alert component
- Accordion component
- Datepicker component
- Card component
- Button component
- Sheet component
- Tabs component
- Enhanced documentation and introduction page
- Added button type prop
- Added theme switcher on landing page

### Changed
- Improved docs layout and UI
- Updated all current components with library comments
- Improved landing page UI
- Implemented Product Hunt badge on landing page and footer
- Now using our own input component in tabs example
- Optimized Plausible analytics to run only in production
- Thank you for your interest in Goilerplate!

### Removed
- Removed/commented HTMX due to browser console issue/bug
- We're excited to share this release and look forward to your feedback. Please note that as we're still in the early stages of development (pre-1.0), there might be frequent updates and potential breaking changes.

### Fixed
- Resolved width issue on tabs component
- Fixed dark mode switch issue
