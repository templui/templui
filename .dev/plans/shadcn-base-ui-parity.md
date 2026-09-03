# shadcn/Base UI parity — internal development handoff

Status: active feature branch review
Branch: `feat/shadcn-base-ui-1to1-parity`
Snapshot: 2026-09-04
Audience: maintainers and code-review agents; this is not product documentation

## TL;DR

This branch removes the remaining TemplUI-specific runtime and DOM vocabulary
from the maintained sources and replaces it with a framework-agnostic pendant
of shadcn/Base UI:

- semantic HTML, ARIA and shadcn-style `data-slot` hooks;
- public state attributes such as `data-open`, `data-checked`, `data-selected`,
  `data-pressed` and `data-value`;
- one shared DOM lifecycle with one `MutationObserver`;
- internal instance state in `WeakMap`/`WeakSet`, never in initialized markers;
- native form controls and native events for two-way binding;
- cancelable component events for state without a native form-control pendant.

The implementation must stay boring and explicit. Do not reintroduce a generic
JSON component configuration layer, framework adapters, per-component document
observers or global initialized flags.

## Why this work exists

The repository has moved from TemplUI toward a shadcn/Base UI implementation,
but active code still contained TemplUI-era names and lifecycle patterns:

- `data-tui-*` implementation attributes;
- `_tui*` properties attached directly to DOM elements;
- `window.tui*` globals;
- `--tui-*` custom properties;
- one global observer or initialization marker per component.

Those details made the public DOM inconsistent with shadcn/Base UI, leaked
implementation state into HTML and made DOM replacement increasingly hard to
reason about.

## Non-negotiable contracts

### 1. Framework agnostic core

Component source must not detect, import or name HTMX, Datastar, Alpine, React
or another application framework. DOM insertion is just DOM insertion.

Applications may attach any framework's attributes through public
`templ.Attributes`; the component runtime only understands browser primitives.

### 2. One shared lifecycle

`components/runtime/runtime.js` owns the only component-level
`MutationObserver` and the only component bootstrap listener.

Component adapters register:

- a selector;
- a setup function;
- optional cleanup returned from setup;
- optional public attributes that can change after mount.

The runtime mounts added subtrees, unmounts removed subtrees and routes relevant
attribute mutations. Component instances are tracked in a `WeakMap`.

Forbidden in component adapters:

- `new MutationObserver(...)`;
- `DOMContentLoaded` bootstrap listeners;
- `data-*-initialized` attributes;
- expando state such as `element._tuiState`;
- framework-specific swap events.

### 3. Public DOM state

Use Base UI/shadcn concepts where a corresponding DOM concept exists:

- `data-slot` identifies parts;
- ARIA owns accessibility state;
- `data-open` / `data-closed`;
- `data-checked` / `data-unchecked` / `data-indeterminate`;
- `data-selected`, `data-pressed`, `data-active`;
- `data-value` where an externally writable value is required.

Configuration needed only by local JavaScript should be a small, clearly named
attribute near the element that consumes it. Do not serialize an entire Props
object into a generic configuration blob.

### 4. Two-way binding is mandatory

There are two explicit binding paths.

#### Native form state

Checkbox, switch, radio group, select, combobox, slider, calendar and input OTP
expose or maintain real inputs.

Inbound:

1. External code assigns `.value`, `.checked` or `.indeterminate`.
2. The shared lifecycle's small `watchProperty` bridge detects the native
   property write.
3. The component updates its visible DOM, ARIA and public state attributes.

Outbound:

1. The user interacts with the component.
2. The component updates the real native input.
3. It emits the native `input` and `change` events as appropriate.
4. Forms and reactive binders read the native control normally.

This bridge is generic browser behavior. It must not inspect binding attributes
or know which library assigned the property.

#### Non-form component state

Tabs, accordion, collapsible, toggles and popup open state use:

- a writable public state attribute for inbound changes;
- a bubbling, cancelable custom event with the proposed next value for outbound
  changes.

Cancellation prevents the local state transition. This is the DOM pendant of a
Base UI controlled value plus its change callback.

### 5. DOM replacement and cleanup

Inserted markup must initialize without framework events. Removed markup must
release listeners, timers, positioning and scroll locks through lifecycle
cleanup. Portaled content must not leave stale copies behind.

Repeated mount/unmount cycles must not accumulate:

- document observers;
- duplicate element listeners;
- timers;
- stale portal nodes;
- body scroll locks;
- implementation attributes.

## What the feature branch changes

The current branch commit is `1254983e` (`wip commit soft reset later`). At this
snapshot the worktree was clean and the branch contained one feature commit.

Broadly changed:

- central component runtime and bundle ordering;
- checkbox, switch and radio native-input synchronization;
- select, combobox, slider, calendar and input OTP two-way values;
- tabs, accordion, collapsible, toggle and toggle-group public state;
- dialog, alert dialog, sheet, drawer, popover, hover card, tooltip, dropdown
  menu and context menu open/selection state;
- portal cleanup and shared scroll locking;
- carousel, command, resizable, sidebar, avatar, chart, progress and toast hooks;
- site globals from `window.tui*` to `window.shadcnTempl*`;
- CSS variables and examples/blocks that referenced legacy hooks;
- source-contract tests for lifecycle, public state and two-way binding.

Approximate snapshot diff against the merge base: 146 files, 3,145 insertions
and 2,700 deletions.

## Current branch integration warning

At the snapshot, `main` was six commits ahead of the branch and the feature
branch was one commit ahead. The common base was `2a46bedd`.

The missing main commits include registry, inliner and compiled-JavaScript work
that overlaps this feature conceptually. Rebase or merge `main` before calling
the feature complete. Review conflict resolutions especially around:

- component script bundling;
- runtime installation by the CLI;
- style marker compilation in JavaScript;
- compiled registry output tests.

Do not resolve conflicts by restoring legacy marker names or duplicating
lifecycle behavior.

## Generated-file policy

Repository instruction:

- never run `templ generate` or `go tool templ generate` manually after edits;
- never manually rebuild component `*.min.js` assets;
- normal `task dev` watchers own both outputs.

Therefore review maintained `.templ` and unminified `.js` sources first. Raw
generated `_templ.go` and minified assets may lag until the normal development
workflow runs. After the workflow updates them, audit the generated output too.

## Review plan

### Phase A — understand the architecture

Read first:

1. `components/runtime/runtime.js`
2. `components/scripts.go`
3. `components/scripts_test.go`
4. `components/binding_contract_test.go`

Then inspect one representative from each family:

- boolean: checkbox;
- scalar value: select;
- multiple value: combobox or slider;
- public non-form state: tabs or accordion;
- portaled popup: dialog or popover.

### Phase B — adversarial code review

Search for:

- legacy TemplUI names in maintained sources;
- component-owned observers/bootstrap handlers;
- state attached directly to DOM objects;
- non-cancelable proposed-value events;
- property writes that do not update visible state;
- user interactions that do not notify the native input;
- cleanup functions that miss listeners, timers, portals or scroll locks;
- selectors that use private implementation hooks where `data-slot` exists;
- duplicated generic helpers or unnecessary abstraction layers.

### Phase C — behavior matrix

For every stateful component verify:

| Direction | Expected result |
| --- | --- |
| Initial server props → DOM | Correct ARIA, public state and input value |
| User interaction → input/event | Native input and public state agree |
| External native property → UI | Visible state updates without framework knowledge |
| External public attribute → UI | Component reconciles exactly once |
| Canceled custom event | Local transition does not happen |
| Added subtree | Initializes once |
| Removed subtree | Cleanup runs and no stale portal remains |
| Reinserted subtree | Initializes cleanly without duplicate behavior |

Test mouse, keyboard and programmatic updates. Include single and multiple value
components, disabled/read-only states, form submission and reset-sensitive
controls.

### Phase D — integrate main

1. Review the feature diff before integration.
2. Rebase or merge the latest `main`.
3. Resolve overlaps using the contracts in this document.
4. Let the normal development workflow refresh generated artifacts.
5. Review generated diffs separately from maintained-source decisions.

### Phase E — final validation

Run the repository's normal tests and at minimum:

```sh
go test ./components/...
go test ./...
```

Validate all maintained unminified JavaScript with `node --check`. Parse changed
Templ sources through the formatter's stdout/check path only; do not generate.

Audit maintained sources for forbidden legacy/runtime patterns:

```sh
rg -n -i 'data-tui|_tui|window\.tui|--tui-' \
  --glob '!**/*_templ.go' \
  --glob '!**/*.min.js'

rg -n 'new MutationObserver|DOMContentLoaded' components \
  --glob '*.js' \
  --glob '!*.min.js'

rg -n -i 'htmx|datastar' components \
  --glob '*.js' \
  --glob '!*.min.js'
```

The first scan may legitimately encounter historical prose or a person's name;
every executable/source hit must be examined, not blindly replaced.

## Definition of done

This runtime/legacy phase is done only when:

- the latest `main` is integrated;
- maintained and generated active output contain no legacy TemplUI runtime
  markers;
- exactly one component DOM observer exists;
- component adapters contain no framework integration code;
- two-way binding passes both directions for every stateful component family;
- mount/unmount/reinsert tests show no duplicate behavior or leaked portals;
- keyboard and ARIA behavior remain aligned with the relevant Base UI pendant;
- all Go, JavaScript, Templ and registry tests pass;
- a reviewer can explain each public attribute and event without reading a
  generic config decoder.

This does not by itself prove complete catalog-wide parity. After this phase,
run a separate component-by-component parity matrix against the current shadcn
registry and Base UI documentation for props, DOM, accessibility, keyboard,
positioning, animation and styling.

## Prompt for another review agent

Use this verbatim or adapt it:

> Read `.dev/plans/shadcn-base-ui-parity.md`, then review `main...HEAD` without
> modifying files. Treat the contracts and forbidden patterns as hard
> requirements. Verify the central lifecycle, two-way binding in both
> directions, cleanup after arbitrary DOM replacement, public DOM/ARIA parity
> and absence of TemplUI/framework-specific runtime residue. Report findings by
> severity with exact file and line references. Separate correctness bugs from
> optional refactors, and do not recommend abstraction unless it removes proven
> duplication without hiding DOM behavior.

## References

- shadcn registry: <https://ui.shadcn.com/docs/components>
- Base UI components: <https://base-ui.com/react/components>
- Base UI customization/state attributes:
  <https://base-ui.com/react/handbook/customization>
- Datastar binding reference, used only to validate generic interoperability:
  <https://data-star.dev/reference/attributes>

## Tracking policy

This file is the versioned source of truth for the feature branch. If a public
GitHub issue is created later, keep it short: describe the outcome, link to this
file/branch and track review status. Do not maintain a second copy of this plan
in the issue.
