# AGENTS.md

- After making changes, **never run `templ generate` / `go tool templ generate` and never manually rebuild `*.min.js` component assets**, since both JS minification and generated `_templ.go` files are handled automatically by the normal development workflow (`task dev` / watchers).
