package components

import "embed"

//go:embed **/*.templ **/*.go **/*.js
var TemplFiles embed.FS
