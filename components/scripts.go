package components

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"io/fs"
	"net/http"
	"os"
	"strings"
	"sync"
)

// The component JS bundle is the concatenation of every components/*/*.js
// file. Each file is a standalone IIFE; the lexical walk order keeps
// floatingui/floating_ui_core.js ahead of floating_ui_dom.js, the one pair
// where load order matters. In production the bundle is built once from the
// embedded files; in development it is rebuilt from disk on every request so
// edits hot-reload.

func isDevelopment() bool {
	return os.Getenv("GO_ENV") != "production"
}

func buildBundle(fsys fs.FS) ([]byte, string) {
	var buf bytes.Buffer
	fs.WalkDir(fsys, ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(path, ".js") || strings.HasSuffix(path, ".min.js") {
			return nil
		}
		data, err := fs.ReadFile(fsys, path)
		if err != nil {
			return nil
		}
		buf.WriteString("// components/" + path + "\n")
		buf.Write(data)
		buf.WriteString("\n")
		return nil
	})
	sum := sha256.Sum256(buf.Bytes())
	return buf.Bytes(), hex.EncodeToString(sum[:8])
}

var (
	prodOnce sync.Once
	prodJS   []byte
	prodHash string
)

func bundle() ([]byte, string) {
	if isDevelopment() {
		return buildBundle(os.DirFS("components"))
	}
	prodOnce.Do(func() {
		prodJS, prodHash = buildBundle(TemplFiles)
	})
	return prodJS, prodHash
}

func scriptsSrc() string {
	_, hash := bundle()
	return "/components/templui.js?v=" + hash
}

// ScriptsHandler serves the component JS bundle. Mount it on the route the
// Scripts() tag points at: GET /components/templui.js.
func ScriptsHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		js, hash := bundle()
		etag := `"` + hash + `"`
		w.Header().Set("Content-Type", "application/javascript")
		w.Header().Set("ETag", etag)
		if isDevelopment() {
			w.Header().Set("Cache-Control", "no-store")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			if r.Header.Get("If-None-Match") == etag {
				w.WriteHeader(http.StatusNotModified)
				return
			}
		}
		_, _ = w.Write(js)
	})
}
