package components

import (
	"bytes"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestBundleLoadsSharedLifecycleBeforeComponentAdapters(t *testing.T) {
	js, _ := buildBundle(TemplFiles)
	runtimeIndex := bytes.Index(js, []byte("// components/runtime/runtime.js"))
	firstAdapterIndex := bytes.Index(js, []byte("// components/accordion/accordion.js"))
	if runtimeIndex < 0 {
		t.Fatal("shared lifecycle is missing from the component bundle")
	}
	if firstAdapterIndex < 0 || runtimeIndex > firstAdapterIndex {
		t.Fatal("shared lifecycle must load before component adapters")
	}
}

func TestComponentAdaptersUseOnlyTheSharedDOMLifecycle(t *testing.T) {
	t.Helper()
	err := fs.WalkDir(TemplFiles, ".", func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() || path == "runtime/runtime.js" || !strings.HasSuffix(path, ".js") || strings.HasSuffix(path, ".min.js") {
			return nil
		}
		content, err := fs.ReadFile(TemplFiles, path)
		if err != nil {
			return err
		}
		for _, forbidden := range []string{"new MutationObserver", "DOMContentLoaded", "htmx", "datastar"} {
			if bytes.Contains(bytes.ToLower(content), bytes.ToLower([]byte(forbidden))) {
				t.Errorf("%s contains framework-specific or competing lifecycle code %q", path, forbidden)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestScriptsHandlerServesGeneratedHashedPath(t *testing.T) {
	t.Setenv("GO_ENV", "production")

	mux := http.NewServeMux()
	mux.Handle("GET /components/{bundle}", ScriptsHandler())

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, scriptsSrc(), nil)
	mux.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("GET %s returned %d", scriptsSrc(), recorder.Code)
	}
	if recorder.Body.Len() == 0 {
		t.Fatal("script bundle is empty")
	}
}
