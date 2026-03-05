package components

import "embed"

//go:embed **/*.templ **/*.go **/*.min.js
var TemplFiles embed.FS
