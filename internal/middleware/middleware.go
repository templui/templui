package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/templui/templui/v2/internal/config"
	"github.com/templui/templui/v2/internal/ctxkeys"
)

func CacheControlMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "max-age=0, must-revalidate, no-cache, no-store, private")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		next.ServeHTTP(w, r)
	})
}

// IsHtmxRequest checks if the request is from HTMX
func IsHtmxRequest(r *http.Request) bool {
	return r.Header.Get("HX-Request") == "true"
}

// WithURLPathValue adds the current URL's path to the context.
func WithURLPathValue(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(
			r.Context(),
			ctxkeys.URLPathValue,
			r.URL.Path,
		)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}


// GitHub stars cache
var (
	githubStarsCache struct {
		sync.RWMutex
		stars     int
		lastFetch time.Time
	}
	cacheDuration = 5 * time.Minute
)

// GitHubStarsMiddleware fetches and caches GitHub stars count
func GitHubStarsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		stars := getGitHubStars()
		ctx := context.WithValue(r.Context(), ctxkeys.GitHubStars, stars)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getGitHubStars() int {
	githubStarsCache.RLock()
	if time.Since(githubStarsCache.lastFetch) < cacheDuration && githubStarsCache.stars > 0 {
		stars := githubStarsCache.stars
		githubStarsCache.RUnlock()
		return stars
	}
	githubStarsCache.RUnlock()

	githubStarsCache.Lock()
	defer githubStarsCache.Unlock()

	// Double-check after acquiring write lock
	if time.Since(githubStarsCache.lastFetch) < cacheDuration && githubStarsCache.stars > 0 {
		return githubStarsCache.stars
	}

	// Fetch fresh data
	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest("GET", "https://api.github.com/repos/templui/templui", nil)
	if err != nil {
		return githubStarsCache.stars
	}

	// Add auth header if token is available
	if config.AppConfig != nil && config.AppConfig.GitHubToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", config.AppConfig.GitHubToken))
	}

	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := client.Do(req)
	if err != nil {
		return githubStarsCache.stars
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return githubStarsCache.stars
	}

	var data struct {
		StargazersCount int `json:"stargazers_count"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return githubStarsCache.stars
	}

	githubStarsCache.stars = data.StargazersCount
	githubStarsCache.lastFetch = time.Now()

	return githubStarsCache.stars
}
