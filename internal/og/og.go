// Package og renders the per-page open-graph image, the pendant of
// apps/v4/app/og/route.tsx (satori): 1200x628, black, a stone-700 frame
// (dashed verticals at 64px, solid horizontals at 64px), the title in
// Geist SemiBold 80px (64px past 20 chars, letter-spacing -0.04em,
// leading 1.1), the description in Geist Regular 40px stone-400
// (leading 1.5), and the slashes mark 48px at bottom-24 right-24.
package og

import (
	"bytes"
	"image"
	"image/png"
	"net/http"
	"sync"

	"github.com/fogleman/gg"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/font/sfnt"
	"golang.org/x/image/draw"
	"golang.org/x/image/font"

	"github.com/axadrn/shadcn-templ/v2/assets"
)

const (
	width  = 1200
	height = 628
	frame  = 64  // top-16/left-16 etc.
	inset  = 128 // inset-32 content box
	textW  = 896 // w-[896px]
)

var (
	fontsOnce sync.Once
	regular   *sfnt.Font
	semibold  *sfnt.Font
)

func loadFonts() {
	fontsOnce.Do(func() {
		r, err := assets.Assets.ReadFile("fonts/geist/Geist-Regular.ttf")
		if err != nil {
			panic(err)
		}
		s, err := assets.Assets.ReadFile("fonts/geist/Geist-SemiBold.ttf")
		if err != nil {
			panic(err)
		}
		regular = mustParse(r)
		semibold = mustParse(s)
	})
}

func mustParse(b []byte) *sfnt.Font {
	f, err := opentype.Parse(b)
	if err != nil {
		panic(err)
	}
	return f
}

func face(f *sfnt.Font, size float64) font.Face {
	fc, err := opentype.NewFace(f, &opentype.FaceOptions{Size: size, DPI: 72, Hinting: font.HintingNone})
	if err != nil {
		panic(err)
	}
	return fc
}

// measure returns the width of s at the given letter spacing (px per rune,
// applied between runes like satori's letter-spacing).
func measure(fc font.Face, s string, spacing float64) float64 {
	var w float64
	prev := rune(-1)
	for _, r := range s {
		if prev >= 0 {
			w += float64(fc.Kern(prev, r)) / 64
			w += spacing
		}
		adv, _ := fc.GlyphAdvance(r)
		w += float64(adv) / 64
		prev = r
	}
	return w
}

func drawString(dc *gg.Context, fc font.Face, s string, x, y, spacing float64) {
	dc.SetFontFace(fc)
	if spacing == 0 {
		dc.DrawString(s, x, y)
		return
	}
	prev := rune(-1)
	for _, r := range s {
		if prev >= 0 {
			x += float64(fc.Kern(prev, r)) / 64
			x += spacing
		}
		dc.DrawString(string(r), x, y)
		adv, _ := fc.GlyphAdvance(r)
		x += float64(adv) / 64
		prev = r
	}
}

// wrap greedily breaks s into lines of at most max px, then balances
// (satori: text-wrap balance): the narrowest width that keeps the line
// count also gets used for breaking.
func wrap(fc font.Face, s string, max, spacing float64) []string {
	words := splitWords(s)
	lines := breakAt(fc, words, max, spacing)
	if len(lines) < 2 {
		return lines
	}
	lo, hi := max/2, max
	for i := 0; i < 12; i++ {
		mid := (lo + hi) / 2
		if len(breakAt(fc, words, mid, spacing)) > len(lines) {
			lo = mid
		} else {
			hi = mid
		}
	}
	return breakAt(fc, words, hi, spacing)
}

func splitWords(s string) []string {
	var words []string
	start := -1
	for i, r := range s {
		if r == ' ' {
			if start >= 0 {
				words = append(words, s[start:i])
				start = -1
			}
		} else if start < 0 {
			start = i
		}
	}
	if start >= 0 {
		words = append(words, s[start:])
	}
	return words
}

func breakAt(fc font.Face, words []string, max, spacing float64) []string {
	var lines []string
	line := ""
	for _, w := range words {
		cand := w
		if line != "" {
			cand = line + " " + w
		}
		if line != "" && measure(fc, cand, spacing) > max {
			lines = append(lines, line)
			line = w
			continue
		}
		line = cand
	}
	if line != "" {
		lines = append(lines, line)
	}
	return lines
}

// render draws at 2x and downscales: freetype leaves dropout pixels on
// some glyphs at direct size, supersampling erases them.
func render(title, description string) []byte {
	loadFonts()
	const sc = 2.0
	w, h := width*sc, height*sc
	fr, in, tw := frame*sc, inset*sc, textW*sc
	dc := gg.NewContext(int(w), int(h))

	dc.SetHexColor("#000000")
	dc.Clear()

	// frame, stone-700
	dc.SetHexColor("#44403c")
	dc.SetLineWidth(1 * sc)
	dc.SetDash(4*sc, 4*sc)
	dc.DrawLine(fr+0.5*sc, 0, fr+0.5*sc, h)
	dc.DrawLine(w-fr-0.5*sc, 0, w-fr-0.5*sc, h)
	dc.Stroke()
	dc.SetDash()
	dc.DrawLine(0, fr+0.5*sc, w, fr+0.5*sc)
	dc.DrawLine(0, h-fr-0.5*sc, w, h-fr-0.5*sc)
	dc.Stroke()

	// mark: the slashes, white, 48px box at bottom-24 right-24
	markSize := 48.0 * sc
	s := markSize / 256
	mx := w - 96*sc - markSize
	my := h - 96*sc - markSize
	dc.SetHexColor("#ffffff")
	dc.SetLineWidth(32 * s)
	dc.SetLineCapRound()
	dc.DrawLine(mx+208*s, my+128*s, mx+128*s, my+208*s)
	dc.Stroke()
	dc.DrawLine(mx+192*s, my+40*s, mx+40*s, my+192*s)
	dc.Stroke()

	// content: two equal flex halves inside the inset box
	half := (h - 2*in) / 2

	titleSize := 80.0 * sc
	if len([]rune(title)) > 20 {
		titleSize = 64 * sc
	}
	tf := face(semibold, titleSize)
	spacing := -0.04 * titleSize
	titleLines := wrap(tf, title, tw, spacing)
	lineH := titleSize * 1.1
	blockH := float64(len(titleLines)) * lineH
	ascent := float64(tf.Metrics().Ascent) / 64
	y := in + (half-blockH)/2 + (lineH-titleSize)/2 + ascent
	dc.SetHexColor("#ffffff")
	for _, l := range titleLines {
		drawString(dc, tf, l, in, y, spacing)
		y += lineH
	}

	if description != "" {
		descSize := 40.0 * sc
		df := face(regular, descSize)
		descLines := wrap(df, description, tw, 0)
		descLineH := descSize * 1.5
		dAscent := float64(df.Metrics().Ascent) / 64
		y = in + half + (descLineH-descSize)/2 + dAscent
		dc.SetHexColor("#a8a29e")
		for _, l := range descLines {
			drawString(dc, df, l, in, y, 0)
			y += descLineH
		}
	}

	out := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.CatmullRom.Scale(out, out.Bounds(), dc.Image(), dc.Image().Bounds(), draw.Over, nil)

	var buf bytes.Buffer
	png.Encode(&buf, out)
	return buf.Bytes()
}

func Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		title := clip(r.URL.Query().Get("title"), 200)
		description := clip(r.URL.Query().Get("description"), 300)
		w.Header().Set("Content-Type", "image/png")
		w.Header().Set("Cache-Control", "public, max-age=86400")
		w.Write(render(title, description))
	})
}

func clip(s string, n int) string {
	r := []rune(s)
	if len(r) > n {
		return string(r[:n])
	}
	return s
}
