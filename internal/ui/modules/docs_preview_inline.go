package modules

import (
	"context"
	"strings"
	"sync"

	"github.com/a-h/templ"
	"github.com/templui/templui/assets"
	"github.com/templui/templui/internal/inliner"
)

// The docs previews render the compiled utility build of a style, like
// shadcn's docs render their per-style compiled registry: the demo component
// is rendered once with its canonical cn-* classes, then the inliner's HTML
// pass expands them into the style's flat utilities. The stylesheet cascade
// never sees cn-* here, so twMerge's caller-wins semantics hold exactly.

// styleNames lists the vendored styles in globals.css import order.
var styleNames = []string{"vega", "nova", "lyra", "maia", "mira", "luma", "sera", "rhea"}

var (
	styleMapsOnce sync.Once
	styleMaps     map[string]inliner.StyleMap
)

// previewStyleMap resolves shadcn's styleName attribute ("base-rhea") to the
// parsed style map; the docs default is nova (the body's style).
func previewStyleMap(styleName string) inliner.StyleMap {
	styleMapsOnce.Do(func() {
		styleMaps = make(map[string]inliner.StyleMap, len(styleNames))
		for _, name := range styleNames {
			css, err := assets.Assets.ReadFile("css/styles/style-" + name + ".css")
			if err != nil {
				continue
			}
			styleMap, err := inliner.CreateStyleMap(string(css))
			if err != nil {
				continue
			}
			styleMaps[name] = styleMap
		}
	})

	if styleMap, ok := styleMaps[strings.TrimPrefix(styleName, "base-")]; ok {
		return styleMap
	}
	return styleMaps["nova"]
}

// inlinedPreviewHTML renders the demo component and compiles its class
// attributes for the preview's style.
func inlinedPreviewHTML(ctx context.Context, component templ.Component, styleName string) (string, error) {
	var buf strings.Builder
	if err := component.Render(ctx, &buf); err != nil {
		return "", err
	}
	return inliner.InlineHTML(buf.String(), previewStyleMap(styleName), inliner.Options{}), nil
}
