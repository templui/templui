package dashboard01

import (
	"context"
	"net/http"
	"strconv"

	"github.com/a-h/templ"
)

// The tsx keeps pagination in tanstack client state; the templ pendant is
// the URL: ?page= and ?size= drive the server-rendered window (backend is
// the state). The nav buttons are plain links, so the block works with no
// script and no dependency - wire them to your swap layer of choice (HTMX
// etc.) for partial updates.

type requestKey struct{}

// WithRequest puts the request into the render context so DataTable can
// read its pagination params. Mount the block page like:
//
//	mux.Handle("GET /dashboard", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
//		r = r.WithContext(dashboard01.WithRequest(r.Context(), r))
//		// The htmx requests ask for a templ fragment (?fragment=) and the
//		// clean URL rides back on HX-Push-Url:
//		if f := r.URL.Query().Get("fragment"); f != "" {
//			if f == "data-table" && r.Header.Get("HX-Request") == "true" {
//				q := r.URL.Query()
//				q.Del("fragment")
//				w.Header().Set("HX-Push-Url", r.URL.Path+"?"+q.Encode())
//			}
//			templ.Handler(dashboard01.Page(), templ.WithFragments(f)).ServeHTTP(w, r)
//			return
//		}
//		dashboard01.Page().Render(r.Context(), w)
//	}))
//
// Without it the block still renders, on page 1 with 10 rows.
func WithRequest(ctx context.Context, r *http.Request) context.Context {
	return context.WithValue(ctx, requestKey{}, r)
}

// dataTablePageSizes mirrors the tsx rows-per-page options.
var dataTablePageSizes = []int{10, 20, 30, 40, 50}

// dataTablePageParams reads ?page= and ?size= from the request in ctx,
// clamped to the option list and the page count (the tanstack state's
// pageIndex/pageSize pendant).
func dataTablePageParams(ctx context.Context, total int) (page, size int) {
	page, size = 1, dataTablePageSize
	r, ok := ctx.Value(requestKey{}).(*http.Request)
	if !ok {
		return page, size
	}
	if s, err := strconv.Atoi(r.URL.Query().Get("size")); err == nil {
		for _, option := range dataTablePageSizes {
			if s == option {
				size = s
				break
			}
		}
	}
	if p, err := strconv.Atoi(r.URL.Query().Get("page")); err == nil {
		page = min(max(p, 1), dataTablePageCount(total, size))
	}
	return page, size
}

// dataTablePageCount is the getPageCount pendant.
func dataTablePageCount(total, size int) int {
	return max((total+size-1)/size, 1)
}

// dataTablePageWindow slices the current page's rows.
func dataTablePageWindow(data []Item, page, size int) []Item {
	start := min((page-1)*size, len(data))
	return data[start:min(start+size, len(data))]
}

// dataTablePageHref builds the ?page=&size= link of a nav button.
func dataTablePageHref(page, size int) string {
	return "?page=" + strconv.Itoa(page) + "&size=" + strconv.Itoa(size)
}

// dataTableHxAttrs are the htmx attributes of a pagination control: fetch
// the data-table fragment and swap this table in place. The clean URL
// (without the fragment param) is pushed by the server's HX-Push-Url
// response header - see the WithRequest mount example. Datastar users
// translate these attributes 1:1.
func dataTableHxAttrs(href string) templ.Attributes {
	return templ.Attributes{
		"hx-get":    href + "&fragment=data-table",
		"hx-target": "[data-dashboard01-table]",
		"hx-swap":   "outerHTML",
	}
}

// dataTableDrawerFragment names a row drawer's templ fragment.
func dataTableDrawerFragment(id int) string {
	return "row-drawer-" + strconv.Itoa(id)
}

// dataTableDrawerBodyID is the DOM id the drawer trigger's hx-target swaps
// the lazy-loaded body into.
func dataTableDrawerBodyID(id int) string {
	return "row-drawer-body-" + strconv.Itoa(id)
}

// dataTableDrawerRequested reports whether this row's drawer content is the
// requested fragment: only then does the heavy drawer body (chart + form)
// render. Every other render ships the skeleton, and the drawer trigger
// lazy-loads the body on first open.
func dataTableDrawerRequested(ctx context.Context, id int) bool {
	r, ok := ctx.Value(requestKey{}).(*http.Request)
	return ok && r.URL.Query().Get("fragment") == dataTableDrawerFragment(id)
}
