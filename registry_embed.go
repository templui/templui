// Package templui exposes the repo-root registry.json, the pendant of
// shadcn's app-root registry file (registry.json schema).
package templui

import _ "embed"

//go:embed registry.json
var RegistryJSON []byte
