package components

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

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
