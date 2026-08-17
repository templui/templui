package components

import (
	"bytes"
	"compress/gzip"
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

// developmentComponentsDir is rewritten by the CLI when aliases.components
// points somewhere other than the default components directory.
const developmentComponentsDir = "components"

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
	prodGz   []byte
	prodHash string
)

// gzipBundle compresses once so bare Go deployments without a compressing
// proxy still ship ~5x smaller transfers; proxies that compress themselves
// simply never see the identity variant.
func gzipBundle(js []byte) []byte {
	var buf bytes.Buffer
	zw, _ := gzip.NewWriterLevel(&buf, gzip.BestCompression)
	_, _ = zw.Write(js)
	_ = zw.Close()
	return buf.Bytes()
}

func bundle() ([]byte, []byte, string) {
	if isDevelopment() {
		js, hash := buildBundle(os.DirFS(developmentComponentsDir))
		return js, nil, hash
	}
	prodOnce.Do(func() {
		prodJS, prodHash = buildBundle(TemplFiles)
		prodGz = gzipBundle(prodJS)
	})
	return prodJS, prodGz, prodHash
}

// The content hash lives in the path like Next's static chunks
// (/_next/static/chunks/<hash>.js): query strings are ignored by some CDN
// caches, path hashes never are.
func scriptsSrc() string {
	_, _, hash := bundle()
	return "/components/shadcn-templ-" + hash + ".js"
}

// ScriptsHandler serves the component JS bundle. Mount it on
// GET /components/{bundle}: it answers the current hashed name
// (shadcn-templ-<hash>.js) and the plain shadcn-templ.js alias, 404s anything else.
func ScriptsHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		js, gz, hash := bundle()
		base := r.URL.Path[strings.LastIndex(r.URL.Path, "/")+1:]
		if base != "shadcn-templ.js" && base != "shadcn-templ-"+hash+".js" {
			http.NotFound(w, r)
			return
		}
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
		if gz != nil && strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			w.Header().Set("Content-Encoding", "gzip")
			w.Header().Set("Vary", "Accept-Encoding")
			_, _ = w.Write(gz)
			return
		}
		_, _ = w.Write(js)
	})
}
