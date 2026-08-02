// Package templui exposes the repo-root registry.json, the pendant of
// shadcn's app-root registry file (registry.json schema), and the utils
// sources the registry:lib item serves.
package templui

import "embed"

//go:embed registry.json
var RegistryJSON []byte

//go:embed utils/*.go
var UtilsFiles embed.FS
