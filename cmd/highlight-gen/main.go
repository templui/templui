// highlight-gen produces the build-time shiki cache (CREATE_1TO1_PLAN 2f):
// it crawls every sitemap URL of a running docs server (which must have the
// node shiki service and HIGHLIGHT_DUMP=1), so every page renders once and
// fills the in-memory highlight cache, then fetches the hashed dump from
// /debug/highlight-cache and writes it gzipped. The production image loads
// that file instead of running the node service.
package main

import (
	"compress/gzip"
	"encoding/xml"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"
)

type urlset struct {
	URLs []struct {
		Loc string `xml:"loc"`
	} `xml:"url"`
}

func main() {
	server := flag.String("server", "http://localhost:8090", "running docs server to crawl")
	out := flag.String("out", "assets/highlight-cache.json.gz", "output file")
	flag.Parse()

	client := &http.Client{Timeout: 60 * time.Second}

	// The server may still be starting inside the docker build stage.
	if err := waitReady(client, *server); err != nil {
		log.Fatalf("server not reachable: %v", err)
	}

	locs, err := sitemapLocs(client, *server)
	if err != nil {
		log.Fatalf("sitemap: %v", err)
	}
	log.Printf("crawling %d pages", len(locs))

	failed := 0
	for i, loc := range locs {
		pageURL, err := rewriteHost(loc, *server)
		if err != nil {
			log.Printf("WARN: skipping %s: %v", loc, err)
			failed++
			continue
		}
		resp, err := client.Get(pageURL)
		if err != nil {
			log.Printf("WARN: %s: %v", pageURL, err)
			failed++
			continue
		}
		io.Copy(io.Discard, resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			log.Printf("WARN: %s: %d", pageURL, resp.StatusCode)
			failed++
		}
		if (i+1)%25 == 0 {
			log.Printf("  %d/%d", i+1, len(locs))
		}
	}
	if failed > 0 {
		log.Printf("WARN: %d pages failed - their code blocks will fall back to plain text", failed)
	}

	resp, err := client.Get(*server + "/debug/highlight-cache")
	if err != nil {
		log.Fatalf("dump: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		log.Fatalf("dump: status %d (is HIGHLIGHT_DUMP=1 set on the server?)", resp.StatusCode)
	}

	f, err := os.Create(*out)
	if err != nil {
		log.Fatalf("create %s: %v", *out, err)
	}
	defer f.Close()
	zw := gzip.NewWriter(f)
	n, err := io.Copy(zw, resp.Body)
	if err != nil {
		log.Fatalf("write: %v", err)
	}
	if err := zw.Close(); err != nil {
		log.Fatalf("close: %v", err)
	}
	log.Printf("wrote %s (%d bytes raw)", *out, n)
}

func waitReady(client *http.Client, server string) error {
	var lastErr error
	for i := 0; i < 60; i++ {
		resp, err := client.Get(server + "/sitemap.xml")
		if err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return nil
			}
			lastErr = fmt.Errorf("status %d", resp.StatusCode)
		} else {
			lastErr = err
		}
		time.Sleep(time.Second)
	}
	return lastErr
}

func sitemapLocs(client *http.Client, server string) ([]string, error) {
	resp, err := client.Get(server + "/sitemap.xml")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var set urlset
	if err := xml.NewDecoder(resp.Body).Decode(&set); err != nil {
		return nil, err
	}
	locs := make([]string, 0, len(set.URLs))
	for _, u := range set.URLs {
		locs = append(locs, u.Loc)
	}
	return locs, nil
}

// rewriteHost keeps the sitemap URL's path but points it at the local server.
func rewriteHost(loc, server string) (string, error) {
	u, err := url.Parse(loc)
	if err != nil {
		return "", err
	}
	s, err := url.Parse(server)
	if err != nil {
		return "", err
	}
	u.Scheme = s.Scheme
	u.Host = s.Host
	return u.String(), nil
}
