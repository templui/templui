// Package chart is templUI's chart component: a server side SVG engine
// that renders Recharts-compatible markup (same class names and attribute
// contract, so the shadcn chart container CSS applies verbatim). The
// geometry ports Recharts' and d3-shape's exact algorithms; chart.js adds
// the client side pendants for tooltips, cursors and responsive
// re-rendering.
package chart

import (
	"fmt"
	"math"
	"strings"
)

// FmtF renders a coordinate like Recharts does (no trailing zeros).
func FmtF(v float64) string {
	s := fmt.Sprintf("%.3f", v)
	s = strings.TrimRight(s, "0")
	return strings.TrimRight(s, ".")
}

// getDigitCount is recharts-scale's arithmetic.getDigitCount.
func getDigitCount(v float64) int {
	if v == 0 {
		return 1
	}
	return int(math.Floor(math.Log10(math.Abs(v)))) + 1
}

// adaptiveStep is recharts-scale's getAdaptiveStep: snap the rough step to
// a multiple of 0.05 (0.1 for single digit steps) of the next power of ten.
func adaptiveStep(rough float64, correction int) float64 {
	if rough <= 0 {
		return 0
	}
	digitCount := getDigitCount(rough)
	digitCountValue := math.Pow(10, float64(digitCount))
	stepRatio := rough / digitCountValue
	scale := 0.05
	if digitCount == 1 {
		scale = 0.1
	}
	return (math.Ceil(stepRatio/scale) + float64(correction)) * scale * digitCountValue
}

// NiceTicks is recharts-scale's getNiceTickValues for a [0,max] domain:
// calculateStep with 0 fixed as a tick, growing the step until the tick
// count covers the domain.
func NiceTicks(max float64, count int) []float64 {
	if count < 2 {
		count = 2
	}
	for correction := 0; ; correction++ {
		step := adaptiveStep(max/float64(count-1), correction)
		if step <= 0 {
			return []float64{0}
		}
		if int(math.Ceil(max/step))+1 > count {
			continue
		}
		ticks := make([]float64, count)
		for i := range ticks {
			ticks[i] = step * float64(i)
		}
		return ticks
	}
}

// LinearY maps a value into plot coordinates, domain [0, dmax] top-down.
func LinearY(v, dmax, top, height float64) float64 {
	if dmax == 0 {
		return top + height
	}
	return top + height - (v/dmax)*height
}

// RoundedBarPath draws a bar as Recharts does: a path with all four corners
// rounded by radius (clamped to the bar's half sizes).
func RoundedBarPath(x, y, w, h, r float64) string {
	r = math.Min(r, math.Min(w/2, h/2))
	if r <= 0 {
		return fmt.Sprintf("M %s,%s h %s v %s h %s Z", FmtF(x), FmtF(y), FmtF(w), FmtF(h), FmtF(-w))
	}
	return fmt.Sprintf(
		"M %s,%s a %s,%s 0 0 1 %s,%s h %s a %s,%s 0 0 1 %s,%s v %s a %s,%s 0 0 1 %s,%s h %s a %s,%s 0 0 1 %s,%s Z",
		FmtF(x), FmtF(y+r),
		FmtF(r), FmtF(r), FmtF(r), FmtF(-r),
		FmtF(w-2*r),
		FmtF(r), FmtF(r), FmtF(r), FmtF(r),
		FmtF(h-2*r),
		FmtF(r), FmtF(r), FmtF(-r), FmtF(r),
		FmtF(-(w-2*r)),
		FmtF(r), FmtF(r), FmtF(-r), FmtF(-r),
	)
}

// BarGeometry is combineAllBarPositions' no-barSize branch for a single
// series: the offset stays the raw category gap while the bar size is
// rounded to whole pixels (Math.round for sizes above 1).
func BarGeometry(band, categoryGap float64) (offset, size float64) {
	offset = categoryGap * band
	size = band - 2*offset
	if size > 1 {
		size = math.Round(size)
	}
	return offset, size
}

// naturalControls is d3-shape's natural cubic spline solver, the exact
// algorithm behind Recharts' type="natural" curves.
func naturalControls(x []float64) (p1, p2 []float64) {
	n := len(x) - 1
	a := make([]float64, n)
	b := make([]float64, n)
	r := make([]float64, n)
	a[0], b[0], r[0] = 0, 2, x[0]+2*x[1]
	for i := 1; i < n-1; i++ {
		a[i], b[i], r[i] = 1, 4, 4*x[i]+2*x[i+1]
	}
	a[n-1], b[n-1], r[n-1] = 2, 7, 8*x[n-1]+x[n]
	for i := 1; i < n; i++ {
		m := a[i] / b[i-1]
		b[i] -= m
		r[i] -= m * r[i-1]
	}
	a[n-1] = r[n-1] / b[n-1]
	for i := n - 2; i >= 0; i-- {
		a[i] = (r[i] - a[i+1]) / b[i]
	}
	b[n-1] = (x[n] + a[n-1]) / 2
	for i := 0; i < n-1; i++ {
		b[i] = 2*x[i+1] - a[i+1]
	}
	return a, b
}

// NaturalPath renders the open natural curve through the points.
func NaturalPath(xs, ys []float64) string {
	if len(xs) < 2 {
		return ""
	}
	cx1, cx2 := naturalControls(xs)
	cy1, cy2 := naturalControls(ys)
	var sb strings.Builder
	fmt.Fprintf(&sb, "M%s,%s", FmtF(xs[0]), FmtF(ys[0]))
	for i := 0; i < len(xs)-1; i++ {
		fmt.Fprintf(&sb, "C%s,%s,%s,%s,%s,%s",
			FmtF(cx1[i]), FmtF(cy1[i]), FmtF(cx2[i]), FmtF(cy2[i]), FmtF(xs[i+1]), FmtF(ys[i+1]))
	}
	return sb.String()
}

// AreaPath closes the natural curve down to the baseline, like Recharts'
// Area which draws the curve, a line to the baseline and the reversed
// baseline back to the start.
func AreaPath(xs, ys []float64, baseline float64) string {
	curve := NaturalPath(xs, ys)
	last := len(xs) - 1
	return fmt.Sprintf("%sL%s,%sL%s,%sZ", curve, FmtF(xs[last]), FmtF(baseline), FmtF(xs[0]), FmtF(baseline))
}

// AreaPathBetween closes a stacked area between an upper and a lower
// series like d3-shape: the top curve forward, a line to the base end and
// the base curve reversed.
func AreaPathBetween(xs, ysTop, ysBase []float64) string {
	n := len(xs)
	rx := make([]float64, n)
	rb := make([]float64, n)
	for i := 0; i < n; i++ {
		rx[i] = xs[n-1-i]
		rb[i] = ysBase[n-1-i]
	}
	base := NaturalPath(rx, rb)
	return NaturalPath(xs, ysTop) + "L" + base[1:] + "Z"
}

// charWidths12 are per character widths of the docs font at 12px, measured
// via canvas measureText. Recharts measures tick labels in the DOM; this
// table is the SSR stand-in (label widths are plain sums, no kerning).
var charWidths12 = map[rune]float64{
	'A': 8.016, 'B': 8.16, 'C': 8.436, 'D': 8.328, 'E': 7.236, 'F': 7.08,
	'G': 8.4, 'H': 8.556, 'I': 3.24, 'J': 7.164, 'K': 7.68, 'L': 6.96,
	'M': 10.524, 'N': 8.916, 'O': 8.868, 'P': 7.8, 'Q': 8.796, 'R': 8.064,
	'S': 7.68, 'T': 6.624, 'U': 8.268, 'V': 8.004, 'W': 11.34, 'X': 7.272,
	'Y': 6.912, 'Z': 6.528,
	'a': 6.612, 'b': 7.14, 'c': 6.552, 'd': 7.14, 'e': 6.732, 'f': 4.74,
	'g': 7.128, 'h': 6.972, 'i': 2.928, 'j': 3.12, 'k': 7.08, 'l': 3.204,
	'm': 10.524, 'n': 6.972, 'o': 6.876, 'p': 7.14, 'q': 7.14, 'r': 4.548,
	's': 6.24, 't': 4.704, 'u': 6.9, 'v': 6.432, 'w': 9.828, 'x': 7.02,
	'y': 6.444, 'z': 6.444,
	'0': 7.956, '1': 4.608, '2': 7.428, '3': 7.356, '4': 7.38, '5': 7.512,
	'6': 7.116, '7': 6.288, '8': 7.248, '9': 7.116,
	' ': 3, ',': 2.412, '.': 2.412, '-': 5.028,
}

// stringWidth estimates a tick label's rendered width at 12px.
func stringWidth(s string) float64 {
	w := 0.0
	for _, r := range s {
		if cw, ok := charWidths12[r]; ok {
			w += cw
		} else {
			w += 7
		}
	}
	return w
}

// AxisTick is one visible tick after culling.
type AxisTick struct {
	Index int
	Coord float64 // tickCoord, the last tick can be clamped into the view
}

// PreserveEndTicks is Recharts' getTicksEnd (the default "preserveEnd"
// interval): walk from the last tick, clamp it into the view, and keep every
// tick whose label fits before the previous kept one with minTickGap space.
func PreserveEndTicks(coords []float64, labels []string, viewEnd, minTickGap float64) []AxisTick {
	start := 0.0
	end := viewEnd
	kept := make([]AxisTick, 0, len(coords))
	for i := len(coords) - 1; i >= 0; i-- {
		size := stringWidth(labels[i])
		tickCoord := coords[i]
		if i == len(coords)-1 {
			if gap := tickCoord + size/2 - end; gap > 0 {
				tickCoord -= gap
			}
		}
		if tickCoord < start || tickCoord > end {
			continue
		}
		if tickCoord-size/2-start >= 0 && tickCoord+size/2-end <= 0 {
			end = tickCoord - (size/2 + minTickGap)
			kept = append(kept, AxisTick{Index: i, Coord: tickCoord})
		}
	}
	// Reverse into ascending order.
	for l, r := 0, len(kept)-1; l < r; l, r = l+1, r-1 {
		kept[l], kept[r] = kept[r], kept[l]
	}
	return kept
}

// SectorPath is Recharts' pie sector: angles in degrees, 0 at 3 o'clock,
// positive angles counterclockwise (SVG y grows down, hence -sin).
func SectorPath(cx, cy, innerR, outerR, startAngle, endAngle float64) string {
	rad := func(deg float64) float64 { return deg * math.Pi / 180 }
	sx0 := cx + outerR*math.Cos(rad(startAngle))
	sy0 := cy - outerR*math.Sin(rad(startAngle))
	ex0 := cx + outerR*math.Cos(rad(endAngle))
	ey0 := cy - outerR*math.Sin(rad(endAngle))
	sx1 := cx + innerR*math.Cos(rad(endAngle))
	sy1 := cy - innerR*math.Sin(rad(endAngle))
	ex1 := cx + innerR*math.Cos(rad(startAngle))
	ey1 := cy - innerR*math.Sin(rad(startAngle))
	large := 0
	if math.Abs(endAngle-startAngle) > 180 {
		large = 1
	}
	// endAngle < startAngle means clockwise in screen space (sweep 1).
	sweep := 1
	if endAngle > startAngle {
		sweep = 0
	}
	return fmt.Sprintf(
		"M %s,%s A %s,%s,0,%d,%d,%s,%s L %s,%s A %s,%s,0,%d,%d,%s,%s Z",
		FmtF(sx0), FmtF(sy0),
		FmtF(outerR), FmtF(outerR), large, sweep, FmtF(ex0), FmtF(ey0),
		FmtF(sx1), FmtF(sy1),
		FmtF(innerR), FmtF(innerR), large, 1-sweep, FmtF(ex1), FmtF(ey1),
	)
}
