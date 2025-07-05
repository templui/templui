package showcase

import (
	"embed"
)

//go:embed **/*.templ **/**/*.md
var TemplFiles embed.FS
