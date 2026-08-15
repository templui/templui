// Package blocks maps registry:block names onto their templ page
// components, the pendant of shadcn's registry __index__ lookup that
// lib/blocks.ts and the /view route resolve against.
package blocks

import (
	"os"
	"strings"

	"github.com/a-h/templ"

	blocksfs "github.com/axadrn/shadcn-templ/v2/blocks"
	"github.com/axadrn/shadcn-templ/v2/blocks/dashboard01"
	"github.com/axadrn/shadcn-templ/v2/blocks/login01"
	"github.com/axadrn/shadcn-templ/v2/blocks/login02"
	"github.com/axadrn/shadcn-templ/v2/blocks/login03"
	"github.com/axadrn/shadcn-templ/v2/blocks/login04"
	"github.com/axadrn/shadcn-templ/v2/blocks/login05"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar01"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar02"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar03"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar04"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar05"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar06"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar07"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar08"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar09"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar10"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar11"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar12"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar13"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar14"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar15"
	"github.com/axadrn/shadcn-templ/v2/blocks/sidebar16"
	"github.com/axadrn/shadcn-templ/v2/blocks/signup01"
	"github.com/axadrn/shadcn-templ/v2/blocks/signup02"
	"github.com/axadrn/shadcn-templ/v2/blocks/signup03"
	"github.com/axadrn/shadcn-templ/v2/blocks/signup04"
	"github.com/axadrn/shadcn-templ/v2/blocks/signup05"
	"github.com/axadrn/shadcn-templ/v2/internal/registry"
)

// Component returns the page component of a block, or nil for unknown
// names.
func Component(name string) templ.Component {
	switch name {
	case "dashboard-01":
		return dashboard01.Page()
	case "sidebar-01":
		return sidebar01.Page()
	case "sidebar-02":
		return sidebar02.Page()
	case "sidebar-03":
		return sidebar03.Page()
	case "sidebar-04":
		return sidebar04.Page()
	case "sidebar-05":
		return sidebar05.Page()
	case "sidebar-06":
		return sidebar06.Page()
	case "sidebar-07":
		return sidebar07.Page()
	case "sidebar-08":
		return sidebar08.Page()
	case "sidebar-09":
		return sidebar09.Page()
	case "sidebar-10":
		return sidebar10.Page()
	case "sidebar-11":
		return sidebar11.Page()
	case "sidebar-12":
		return sidebar12.Page()
	case "sidebar-13":
		return sidebar13.Page()
	case "sidebar-14":
		return sidebar14.Page()
	case "sidebar-15":
		return sidebar15.Page()
	case "sidebar-16":
		return sidebar16.Page()
	case "login-01":
		return login01.Page()
	case "login-02":
		return login02.Page()
	case "login-03":
		return login03.Page()
	case "login-04":
		return login04.Page()
	case "login-05":
		return login05.Page()
	case "signup-01":
		return signup01.Page()
	case "signup-02":
		return signup02.Page()
	case "signup-03":
		return signup03.Page()
	case "signup-04":
		return signup04.Page()
	case "signup-05":
		return signup05.Page()
	}
	return nil
}

// File is one source file of a block, the shape the block viewer's code
// tab renders (shadcn's highlightedFiles input).
type File struct {
	Path    string
	Content string
}

// isDevelopment mirrors registryapi: outside production sources come fresh
// from disk so edits hot-reload.
func isDevelopment() bool {
	return os.Getenv("GO_ENV") != "production"
}

// Files reads the sources of a block's registry files, from disk in
// development and the blocks embed in production (the
// registryapi.componentSource split).
func Files(item registry.Item) []File {
	out := make([]File, 0, len(item.Files))
	for _, f := range item.Files {
		var src []byte
		var err error
		if isDevelopment() {
			src, err = os.ReadFile("./" + f.Path)
		} else {
			src, err = blocksfs.TemplFiles.ReadFile(strings.TrimPrefix(f.Path, "blocks/"))
		}
		if err != nil {
			continue
		}
		out = append(out, File{Path: f.Path, Content: string(src)})
	}
	return out
}
