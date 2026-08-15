package main

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/axadrn/shadcn-templ/v2/assets"
	"github.com/axadrn/shadcn-templ/v2/internal/config"
)

func TestUpstreamBlockFixtureRoutes(t *testing.T) {
	previousConfig := config.AppConfig
	config.AppConfig = &config.Config{GoEnv: "production"}
	t.Cleanup(func() { config.AppConfig = previousConfig })

	mux := http.NewServeMux()
	SetupAssetsRoutes(mux)

	tests := []struct {
		URL         string
		Asset       string
		ContentType string
	}{
		{"/avatars/shadcn.jpg", "img/shadcn.jpg", "image/jpeg"},
	}
	for _, tt := range tests {
		t.Run(tt.URL, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, tt.URL, nil)
			response := httptest.NewRecorder()
			mux.ServeHTTP(response, request)

			if response.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
			}
			if got := response.Header().Get("Content-Type"); got != tt.ContentType {
				t.Fatalf("content type = %q, want %q", got, tt.ContentType)
			}
			want, err := assets.Assets.ReadFile(tt.Asset)
			if err != nil {
				t.Fatal(err)
			}
			if !bytes.Equal(response.Body.Bytes(), want) {
				t.Fatalf("response does not match embedded %s", tt.Asset)
			}
		})
	}
}
