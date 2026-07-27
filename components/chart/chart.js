/**
 * templUI chart - client renderer.
 *
 * The server emits the chart model as JSON; this module is the pendant of
 * Recharts in the browser and draws everything. It is a literal port of
 * the parts of the reference libraries the chart components need:
 * - recharts ResponsiveContainer: render at the container's real pixel
 *   size via ResizeObserver, so bars, radii and text keep their sizes.
 * - recharts-scale getNiceTickValues: the y domain and tick values.
 * - recharts CartesianAxis preserveEnd: tick culling with measured label
 *   sizes and minTickGap.
 * - d3-shape: curveNatural, curveLinear, curveStep and stackOffsetExpand.
 * - react-smooth: entrance and update animations with the CSS ease bezier,
 *   the from state paints synchronously on mount and the clock starts on
 *   the first real frame.
 * - shadcn ChartTooltipContent and ChartStyle: tooltip markup, classes and
 *   the per chart color variables.
 * Optional model fields carry Recharts' prop defaults at the JSON boundary
 * (xAxisHeight 0, minTickGap 5, tickCount 5, innerRadius 0).
 */

const TOOLTIP_CLASS =
  "border-border/50 bg-background grid min-w-32 items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl";

/* ---------------------------------------------------------------- */
/* Geometry (ports of the Go engine)                                */
/* ---------------------------------------------------------------- */

function fmtF(v) {
  return String(Math.round(v * 1000) / 1000);
}

function getDigitCount(v) {
  if (v === 0) return 1;
  return Math.floor(Math.log10(Math.abs(v))) + 1;
}

function adaptiveStep(rough, correction) {
  if (rough <= 0) return 0;
  const digitCount = getDigitCount(rough);
  const digitCountValue = Math.pow(10, digitCount);
  const stepRatio = rough / digitCountValue;
  const scale = digitCount !== 1 ? 0.05 : 0.1;
  return (Math.ceil(stepRatio / scale) + correction) * scale * digitCountValue;
}

/* recharts-scale getFormatStep: the step between two ticks that reads
 * well (10, 20, 25). */
function getFormatStep(roughStep, allowDecimals, correctionFactor) {
  if (roughStep <= 0) return 0;
  const digitCount = getDigitCount(roughStep);
  const digitCountValue = Math.pow(10, digitCount);
  const stepRatio = roughStep / digitCountValue;
  const stepRatioScale = digitCount !== 1 ? 0.05 : 0.1;
  const amendStepRatio = (Math.ceil(stepRatio / stepRatioScale) + correctionFactor) * stepRatioScale;
  const formatStep = amendStepRatio * digitCountValue;
  return allowDecimals ? formatStep : Math.ceil(formatStep);
}

/* recharts-scale calculateStep: zero is always a tick when the interval
 * contains it, and the step grows until the ticks cover the interval. */
function calculateStep(min, max, tickCount, allowDecimals, correctionFactor = 0) {
  if (!Number.isFinite((max - min) / (tickCount - 1))) {
    return { step: 0, tickMin: 0, tickMax: 0 };
  }
  const step = getFormatStep((max - min) / (tickCount - 1), allowDecimals, correctionFactor);
  let middle;
  if (min <= 0 && max >= 0) {
    middle = 0;
  } else {
    middle = (min + max) / 2;
    middle = middle - (middle % step);
  }
  let belowCount = Math.ceil((middle - min) / step);
  let upCount = Math.ceil((max - middle) / step);
  const scaleCount = belowCount + upCount + 1;
  if (scaleCount > tickCount) {
    return calculateStep(min, max, tickCount, allowDecimals, correctionFactor + 1);
  }
  if (scaleCount < tickCount) {
    upCount = max > 0 ? upCount + (tickCount - scaleCount) : upCount;
    belowCount = max > 0 ? belowCount : belowCount + (tickCount - scaleCount);
  }
  return { step, tickMin: middle - belowCount * step, tickMax: middle + upCount * step };
}

/* recharts-scale getNiceTickValues: the tick values of an interval, with
 * the count guaranteed. */
function niceTickValues(min, max, tickCount = 6, allowDecimals = true) {
  const count = Math.max(tickCount, 2);
  if (min === max) return [min];
  const { step, tickMin, tickMax } = calculateStep(min, max, count, allowDecimals);
  if (step <= 0) return [0];
  const values = [];
  for (let v = tickMin; v <= tickMax + 0.1 * step; v += step) values.push(v);
  return values;
}

function linearY(v, dmax, top, height) {
  if (dmax === 0) return top + height;
  return top + height - (v / dmax) * height;
}

/* expandValues normalizes stacked values per index to a total of 1
 * (d3-shape stackOffsetExpand behind Recharts' "expand"). */
function expandValues(series) {
  const n = series[0].values.length;
  const vals = series.map(() => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (const s of series) sum += s.values[i];
    if (sum > 0) {
      series.forEach((s, si) => {
        vals[si][i] = s.values[i] / sum;
      });
    }
  }
  return vals;
}

/* domainTicks computes a model's nice tick values (stacked aware); the
 * domain spans from the first to the last tick, like Recharts. */
function domainTicks(m, tickCount = 5) {
  if (m.stackOffset === "expand") {
    return Array.from({ length: tickCount }, (_, i) => i / (tickCount - 1));
  }
  let max = 0;
  let min = 0;
  const n = m.series[0].values.length;
  if (m.stacked) {
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (const s of m.series) sum += s.values[i];
      if (sum > max) max = sum;
      if (sum < min) min = sum;
    }
  } else {
    for (const s of m.series) {
      for (const v of s.values) {
        if (v > max) max = v;
        if (v < min) min = v;
      }
    }
  }
  return niceTickValues(min, max, tickCount);
}

/* domainOf is the top of the value domain, used to pin the scale during a
 * morph. */
function domainOf(m) {
  const t = domainTicks(m);
  return t[t.length - 1];
}

/* valueScale maps a value onto its pixel position. With negative values
 * the domain spans [min, max] and the zero baseline sits inside the plot,
 * like Recharts' linear scale. */
function valueScale(m, start, length, ticks) {
  const max = ticks[ticks.length - 1];
  const min = ticks[0];
  const span = max - min || 1;
  return {
    max,
    min,
    // pos returns the pixel of a value along the axis from start.
    pos: (v) => start + length - ((v - min) / span) * length,
    zero: start + length - ((0 - min) / span) * length,
  };
}

function barPositions(band, categoryGap, count) {
  const gap = categoryGap * band;
  let realBarGap = 4;
  if (band - 2 * gap - (count - 1) * realBarGap <= 0) realBarGap = 0;
  let size = (band - 2 * gap - (count - 1) * realBarGap) / count;
  if (size > 1) size = Math.round(size);
  const offsets = [];
  for (let i = 0; i < count; i++) offsets.push(gap + (size + realBarGap) * i);
  return [offsets, size];
}

/* getRectanglePath from Recharts' Rectangle: the radius is one value for
 * all corners or four values starting at the top left, clamped to half the
 * rectangle. */
function roundedBarPath(x, y, w, h, radius) {
  const corners = Array.isArray(radius) ? radius : [radius || 0];
  const [tl, tr, br, bl] = corners.length === 4 ? corners : [corners[0] || 0, corners[0] || 0, corners[0] || 0, corners[0] || 0];
  const max = Math.min(Math.abs(w) / 2, Math.abs(h) / 2);
  const c = [tl, tr, br, bl].map((v) => Math.max(0, Math.min(v, max)));
  if (c.every((v) => v === 0)) {
    return `M ${fmtF(x)},${fmtF(y)} h ${fmtF(w)} v ${fmtF(h)} h ${fmtF(-w)} Z`;
  }
  return (
    `M ${fmtF(x)},${fmtF(y + c[0])} a ${fmtF(c[0])},${fmtF(c[0])} 0 0 1 ${fmtF(c[0])},${fmtF(-c[0])} ` +
    `h ${fmtF(w - c[0] - c[1])} a ${fmtF(c[1])},${fmtF(c[1])} 0 0 1 ${fmtF(c[1])},${fmtF(c[1])} ` +
    `v ${fmtF(h - c[1] - c[2])} a ${fmtF(c[2])},${fmtF(c[2])} 0 0 1 ${fmtF(-c[2])},${fmtF(c[2])} ` +
    `h ${fmtF(-(w - c[2] - c[3]))} a ${fmtF(c[3])},${fmtF(c[3])} 0 0 1 ${fmtF(-c[3])},${fmtF(-c[3])} Z`
  );
}

function naturalControls(x) {
  const n = x.length - 1;
  const a = new Array(n);
  const b = new Array(n);
  const r = new Array(n);
  a[0] = 0;
  b[0] = 2;
  r[0] = x[0] + 2 * x[1];
  for (let i = 1; i < n - 1; i++) {
    a[i] = 1;
    b[i] = 4;
    r[i] = 4 * x[i] + 2 * x[i + 1];
  }
  a[n - 1] = 2;
  b[n - 1] = 7;
  r[n - 1] = 8 * x[n - 1] + x[n];
  for (let i = 1; i < n; i++) {
    const m = a[i] / b[i - 1];
    b[i] -= m;
    r[i] -= m * r[i - 1];
  }
  a[n - 1] = r[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    a[i] = (r[i] - a[i + 1]) / b[i];
  }
  b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (let i = 0; i < n - 1; i++) {
    b[i] = 2 * x[i + 1] - a[i + 1];
  }
  return [a, b];
}

function naturalPath(xs, ys) {
  if (xs.length < 2) return "";
  const [cx1, cx2] = naturalControls(xs);
  const [cy1, cy2] = naturalControls(ys);
  let d = `M${fmtF(xs[0])},${fmtF(ys[0])}`;
  for (let i = 0; i < xs.length - 1; i++) {
    d += `C${fmtF(cx1[i])},${fmtF(cy1[i])},${fmtF(cx2[i])},${fmtF(cy2[i])},${fmtF(xs[i + 1])},${fmtF(ys[i + 1])}`;
  }
  return d;
}

/* d3-shape curveLinear. */
function linearPath(xs, ys) {
  if (xs.length < 2) return "";
  let d = `M${fmtF(xs[0])},${fmtF(ys[0])}`;
  for (let i = 1; i < xs.length; i++) {
    d += `L${fmtF(xs[i])},${fmtF(ys[i])}`;
  }
  return d;
}

/* d3-shape curveStep (t = 0.5): y switches at the midpoint, ends on the
 * last point. */
function stepPath(xs, ys) {
  if (xs.length < 2) return "";
  let d = `M${fmtF(xs[0])},${fmtF(ys[0])}`;
  for (let i = 1; i < xs.length; i++) {
    const x1 = (xs[i - 1] + xs[i]) / 2;
    d += `L${fmtF(x1)},${fmtF(ys[i - 1])}L${fmtF(x1)},${fmtF(ys[i])}`;
  }
  d += `L${fmtF(xs[xs.length - 1])},${fmtF(ys[ys.length - 1])}`;
  return d;
}

/* d3-shape curveMonotoneX (Steffen 1990 monotone Hermite interpolation),
 * Recharts' type="monotone". */
function monotonePath(xs, ys) {
  if (xs.length < 2) return "";
  const sign = (x) => (x < 0 ? -1 : 1);
  const slope3 = (x0, y0, x1, y1, x2, y2) => {
    const h0 = x1 - x0;
    const h1 = x2 - x1;
    const s0 = (y1 - y0) / (h0 || (h1 < 0 && -0));
    const s1 = (y2 - y1) / (h1 || (h0 < 0 && -0));
    const p = (s0 * h1 + s1 * h0) / (h0 + h1);
    return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  };
  const slope2 = (x0, y0, x1, y1, t) => {
    const h = x1 - x0;
    return h ? (3 * (y1 - y0) / h - t) / 2 : t;
  };
  const bezier = (x0, y0, x1, y1, t0, t1) => {
    const dx = (x1 - x0) / 3;
    return `C${fmtF(x0 + dx)},${fmtF(y0 + dx * t0)},${fmtF(x1 - dx)},${fmtF(y1 - dx * t1)},${fmtF(x1)},${fmtF(y1)}`;
  };
  let d = `M${fmtF(xs[0])},${fmtF(ys[0])}`;
  let t0 = NaN;
  for (let i = 1; i < xs.length; i++) {
    let t1;
    if (i < xs.length - 1) {
      t1 = slope3(xs[i - 1], ys[i - 1], xs[i], ys[i], xs[i + 1], ys[i + 1]);
    } else {
      t1 = slope2(xs[i - 1], ys[i - 1], xs[i], ys[i], t0);
    }
    if (i === 1) t0 = slope2(xs[0], ys[0], xs[1], ys[1], t1);
    d += bezier(xs[i - 1], ys[i - 1], xs[i], ys[i], t0, t1);
    t0 = t1;
  }
  return d;
}

function curvePath(curve, xs, ys) {
  if (curve === "linear") return linearPath(xs, ys);
  if (curve === "step") return stepPath(xs, ys);
  if (curve === "monotone") return monotonePath(xs, ys);
  return naturalPath(xs, ys);
}

/* Recharts' Text verticalAnchor as an SVG dy: the anchor names where the
 * text box sits relative to y. */
function verticalAnchorDy(anchor) {
  if (anchor === "start") return "0.71em";
  if (anchor === "middle") return "0.355em";
  return "0";
}

/* pathLength measures a path string like Recharts measures the rendered
 * curve for the line entrance (strokeDasharray animation). */
let lengthPath = null;
function pathLength(d) {
  if (!lengthPath) {
    lengthPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  }
  lengthPath.setAttribute("d", d);
  return lengthPath.getTotalLength();
}

function areaPathBetween(curve, xs, ysTop, ysBase) {
  const rx = [...xs].reverse();
  const rb = [...ysBase].reverse();
  const base = curvePath(curve, rx, rb);
  return curvePath(curve, xs, ysTop) + "L" + base.slice(1) + "Z";
}

/* preserveEnd tick culling with real text measurement, like Recharts. */
let measureCtx = null;
function measureLabel(label, refEl) {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  const cs = getComputedStyle(refEl);
  measureCtx.font = `${cs.fontSize} ${cs.fontFamily}`;
  return measureCtx.measureText(label).width;
}

/* The label height Recharts reads from the DOM: 1.5 times the font size,
 * matching the measured 18px at 12px text. */
function measureLabelHeight(refEl) {
  return parseFloat(getComputedStyle(refEl).fontSize) * 1.5;
}

function preserveEndTicks(coords, sizes, start, end, minTickGap) {
  let sign = 1;
  if (coords.length >= 2 && coords[1] < coords[0]) sign = -1;
  const kept = [];
  for (let i = coords.length - 1; i >= 0; i--) {
    const size = sizes[i];
    let tickCoord = coords[i];
    if (i === coords.length - 1) {
      const gap = sign * (tickCoord + (sign * size) / 2 - end);
      if (gap > 0) tickCoord -= gap * sign;
    }
    if (sign * tickCoord < sign * start || sign * tickCoord > sign * end) continue;
    if (sign * (tickCoord - (sign * size) / 2 - start) >= 0 && sign * (tickCoord + (sign * size) / 2 - end) <= 0) {
      end = tickCoord - sign * (size / 2 + minTickGap);
      kept.push({ index: i, coord: tickCoord });
    }
  }
  return kept.reverse();
}

/* Recharts' CartesianAxis tickSize: the tick line length, and part of the
 * label offset even when the line is hidden. */
const TICK_SIZE = 6;

/* ---------------------------------------------------------------- */
/* Rendering                                                        */
/* ---------------------------------------------------------------- */

let uid = 0;

/* swapSVG applies a newly built SVG to the panel. While the structure is
 * unchanged (animation frames) it only syncs attributes and text in
 * place, like React's reconciliation in Recharts, so frames never churn
 * DOM nodes. */
function swapSVG(panel, svgString) {
  const old = panel.querySelector("svg.recharts-surface");
  if (!old) {
    panel.insertAdjacentHTML("beforeend", svgString);
    return;
  }
  // Hover overlays (cursor band, active dots) are transient additions,
  // drop them before comparing so animation frames keep the fast path.
  old.querySelectorAll(".recharts-tooltip-cursor").forEach((c) => c.parentElement.remove());
  old.querySelectorAll(".recharts-active-dots").forEach((d) => d.remove());
  const tpl = document.createElement("template");
  tpl.innerHTML = svgString;
  const next = tpl.content.firstElementChild;
  const a = old.querySelectorAll("*");
  const b = next.querySelectorAll("*");
  if (a.length !== b.length) {
    old.replaceWith(next);
    return;
  }
  syncAttrs(old, next);
  for (let i = 0; i < a.length; i++) {
    if (a[i].tagName !== b[i].tagName) {
      old.replaceWith(next);
      return;
    }
    syncAttrs(a[i], b[i]);
    if (b[i].childElementCount === 0 && a[i].textContent !== b[i].textContent) {
      a[i].textContent = b[i].textContent;
    }
  }
}

function syncAttrs(el, src) {
  for (const attr of src.attributes) {
    if (el.getAttribute(attr.name) !== attr.value) {
      el.setAttribute(attr.name, attr.value);
    }
  }
}

/* CSS 'ease' (cubic-bezier(0.25, 0.1, 0.25, 1)), Recharts' default
 * animation easing. */
function cssEase(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let lo = 0;
  let hi = 1;
  // Solve x(u) = t for u, then return y(u).
  const bx = (u) => 3 * u * (1 - u) * (1 - u) * 0.25 + 3 * u * u * (1 - u) * 0.25 + u * u * u;
  const by = (u) => 3 * u * (1 - u) * (1 - u) * 0.1 + 3 * u * u * (1 - u) * 1 + u * u * u;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < t) lo = mid;
    else hi = mid;
  }
  return by((lo + hi) / 2);
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* The Recharts entrance animation: bars grow from the baseline over
 * 400ms, areas reveal left to right and pies sweep over 1500ms.
 * Like react-smooth, the from state paints synchronously on mount (axes
 * and grid are visible immediately) and the clock starts on the first
 * real frame, so charts in throttled frames play the full entrance the
 * moment frames arrive instead of getting stuck blank. */
function animateChart(panel, m, state, render) {
  if (reducedMotion.matches) {
    render(1);
    return;
  }
  const duration = m.kind === "bar" ? 400 : 1500;
  render(0);
  let beginTime;
  const frame = (now) => {
    if (!beginTime) beginTime = now;
    const alpha = cssEase(Math.min(1, (now - beginTime) / duration));
    render(alpha);
    if (alpha < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* The Recharts update animation: every graphical item interpolates its
 * previous points into the new ones in pixel space, index mapped by
 * prevPointsDiffFactor when the point count changed. */
function morphChart(panel, m, state, render, prevPoints) {
  if (reducedMotion.matches) {
    render(1);
    return;
  }
  const duration = m.kind === "bar" ? 400 : 1500;
  const paint = (t) => {
    state.morph = t < 1 ? { prev: prevPoints, t } : null;
    render(1);
  };
  // Like the entrance: the previous state paints synchronously, the clock
  // starts on the first real frame.
  paint(0);
  let beginTime;
  const frame = (now) => {
    if (!beginTime) beginTime = now;
    const t = cssEase(Math.min(1, (now - beginTime) / duration));
    paint(t);
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* interpolate of Recharts' DataUtils. */
function interpolate(start, end, t) {
  if (start == null) return end;
  return start + (end - start) * t;
}

/* morphPoints maps a series' points onto the previous ones the way
 * Recharts does: prevPointsDiffFactor picks the previous index. */
function morphPoints(morph, si, coords, key) {
  if (!morph || !morph.prev || !morph.prev[key] || !morph.prev[key][si]) return coords;
  const prev = morph.prev[key][si];
  const factor = prev.length / coords.length;
  return coords.map((v, i) => {
    const p = prev[Math.floor(i * factor)];
    return p == null ? v : interpolate(p, v, morph.t);
  });
}

function renderCartesian(panel, m, state, alpha = 1) {
  const W = panel.clientWidth;
  const H = panel.clientHeight;
  if (!W || !H) return;
  const legendHeight = legendSize(panel, m);

  const vertical = m.layout === "vertical";
  // selectChartOffsetInternal: the axes add to the margins, the legend box
  // adds to the bottom, and the plot never goes negative.
  const yAxisW = m.yAxisWidth || 0;
  const plotX = m.marginLeft + yAxisW;
  const plotY = m.marginTop;
  const plotW = Math.max(W - m.marginLeft - m.marginRight - yAxisW, 0);
  const plotH = Math.max(H - m.marginTop - m.marginBottom - (m.xAxisHeight || 0) - legendHeight, 0);
  const plotBottom = plotY + plotH;
  const n = m.labels.length;

  // During a morph the scale is pinned to the target domain like
  // Recharts, which interpolates pixel positions on the new scale.
  const tickCount = m.tickCount || 5;
  const ticks = m.domainMax
    ? Array.from({ length: tickCount }, (_, i) => (m.domainMax * i) / (tickCount - 1))
    : domainTicks(m, tickCount);
  const domainMin = ticks[0];
  const domainMax = ticks[ticks.length - 1];

  // Category positions: band centers for bars, evenly spaced points for
  // lines and areas.
  const catStart = vertical ? plotY : plotX;
  const catLength = vertical ? plotH : plotW;
  const bandSize = m.kind === "bar" ? catLength / n : 0;
  const cats = [];
  for (let i = 0; i < n; i++) {
    cats.push(m.kind === "bar" ? catStart + i * bandSize + bandSize / 2 : plotX + (i * plotW) / (n - 1));
  }

  // Explicit pixel size like Recharts' Surface: the svg never stretches
  // between resize frames, every frame lays out fresh.
  let svg = `<svg class="recharts-surface" width="${fmtF(W)}" height="${fmtF(H)}" viewBox="0 0 ${fmtF(W)} ${fmtF(H)}">`;

  if (m.defs && m.defs.length) {
    svg += "<defs>";
    for (const g of m.defs) {
      // The stops are raw markup from the demo, passed through verbatim
      // like Recharts passes defs children through.
      svg += `<linearGradient id="${state.uid}-${g.ID}" x1="${g.X1}" y1="${g.Y1}" x2="${g.X2}" y2="${g.Y2}">${g.Stops || ""}</linearGradient>`;
    }
    svg += "</defs>";
  }

  if (yAxisW > 0 && vertical) {
    // Vertical layout: the y axis carries the category labels.
    const ySizes = cats.map(() => measureLabelHeight(panel));
    const labelX = plotX - TICK_SIZE - (m.yAxisMargin || 0);
    svg += `<g class="recharts-layer recharts-cartesian-axis recharts-yAxis yAxis"><g class="recharts-cartesian-axis-ticks">`;
    // The category coordinates ascend downwards, so the bounds run from
    // the top of the surface to its bottom.
    for (const tk of preserveEndTicks(cats, ySizes, 0, H, m.minTickGap || 5)) {
      svg += `<g class="recharts-layer recharts-cartesian-axis-tick"><text orientation="left" width="${fmtF(yAxisW)}" x="${fmtF(labelX)}" y="${fmtF(tk.coord)}" stroke="none" fill="#666" class="recharts-text recharts-cartesian-axis-tick-value" text-anchor="end"><tspan dy="0.355em">${m.labels[tk.index]}</tspan></text></g>`;
    }
    svg += "</g></g>";
  } else if (yAxisW > 0) {
    const yCoords = ticks.map((tv) => linearY(tv - domainMin, domainMax - domainMin, plotY, plotH));
    const ySizes = ticks.map(() => measureLabelHeight(panel));
    const labelX = plotX - TICK_SIZE - (m.yAxisMargin || 0);
    svg += `<g class="recharts-layer recharts-cartesian-axis recharts-yAxis yAxis">`;
    if (m.yAxisLine) {
      svg += `<line orientation="left" class="recharts-cartesian-axis-line" stroke="#666" fill="none" x1="${fmtF(plotX)}" y1="${fmtF(plotY)}" x2="${fmtF(plotX)}" y2="${fmtF(plotBottom)}"/>`;
    }
    svg += `<g class="recharts-cartesian-axis-ticks">`;
    for (const tk of preserveEndTicks(yCoords, ySizes, H, 0, m.minTickGap || 5)) {
      svg += `<g class="recharts-layer recharts-cartesian-axis-tick">`;
      if (m.yTickLine) {
        svg += `<line orientation="left" class="recharts-cartesian-axis-tick-line" stroke="#666" fill="none" x1="${fmtF(plotX - TICK_SIZE)}" y1="${fmtF(yCoords[tk.index])}" x2="${fmtF(plotX)}" y2="${fmtF(yCoords[tk.index])}"/>`;
      }
      svg += `<text orientation="left" width="${fmtF(yAxisW)}" x="${fmtF(labelX)}" y="${fmtF(tk.coord)}" stroke="none" fill="#666" class="recharts-text recharts-cartesian-axis-tick-value" text-anchor="end"><tspan dy="0.355em">${fmtF(ticks[tk.index])}</tspan></text></g>`;
    }
    svg += "</g></g>";
  }

  if (m.grid) {
    // Recharts draws a line per tick of the value axis and per category of
    // the other one; both directions default to on.
    const valueCoords = ticks.map((tv) => {
      const p = linearY(tv - domainMin, domainMax - domainMin, vertical ? plotX : plotY, vertical ? plotW : plotH);
      return vertical ? plotX + plotW - (p - plotX) : p;
    });
    svg += `<g class="recharts-layer recharts-cartesian-grid">`;
    if (m.gridHorizontal) {
      svg += `<g class="recharts-cartesian-grid-horizontal">`;
      for (const y of vertical ? cats : valueCoords) {
        svg += `<line stroke="#ccc" fill="none" x1="${fmtF(plotX)}" y1="${fmtF(y)}" x2="${fmtF(plotX + plotW)}" y2="${fmtF(y)}"/>`;
      }
      svg += "</g>";
    }
    if (m.gridVertical) {
      svg += `<g class="recharts-cartesian-grid-vertical">`;
      for (const x of vertical ? valueCoords : cats) {
        svg += `<line stroke="#ccc" fill="none" x1="${fmtF(x)}" y1="${fmtF(plotY)}" x2="${fmtF(x)}" y2="${fmtF(plotBottom)}"/>`;
      }
      svg += "</g>";
    }
    svg += "</g>";
  }

  let xs = [];
  let band = 0;
  state.points = { tops: [], a: [], b: [] };
  const vals = m.stackOffset === "expand" ? expandValues(m.series) : m.series.map((s) => s.values);

  if (m.kind === "bar") {
    // The category axis runs along x, or along y when the layout is
    // vertical and the bars grow to the right.
    band = bandSize;
    // Stacked bars share one slot per category, like Recharts' stackId.
    const slots = m.stacked ? 1 : m.series.length;
    const [offsets, barSize] = barPositions(band, m.categoryGap, slots);
    const scale = valueScale(m, vertical ? plotX : plotY, vertical ? plotW : plotH, ticks);
    // In a vertical layout the value axis grows from left to right, so the
    // scale is mirrored around the plot.
    const valuePos = (v) => (vertical ? plotX + plotW - (scale.pos(v) - plotX) : scale.pos(v));
    const zero = vertical ? plotX + plotW - (scale.zero - plotX) : scale.zero;

    const stackBase = new Array(n).fill(0);
    state.tops = [];
    for (let si = 0; si < m.series.length; si++) {
      const s = m.series[si];
      const slot = m.stacked ? 0 : si;
      const tops = [];
      const rectA = [];
      const rectB = [];
      // Recharts' Bar geometry keeps the rectangle signed: the origin is
      // the value end and the size runs back to the baseline, so negative
      // bars carry a negative size. Label positions read those signs.
      const rectPos = [];
      const rectSize = [];
      svg += `<g class="recharts-layer recharts-bar"><g class="recharts-layer recharts-bar-rectangles">`;
      for (let i = 0; i < n; i++) {
        const raw = vals[si][i];
        const from = m.stacked ? stackBase[i] : 0;
        const to = m.stacked ? stackBase[i] + raw : raw;
        // The final rectangle, then Recharts' entrance on top of it:
        // horizontal grows the height from the baseline, vertical the width.
        const base = valuePos(from);
        const end = valuePos(to);
        let a = base;
        let b = end;
        if (state.morph) {
          a = morphPoints(state.morph, si, [a], "a")[0];
          b = morphPoints(state.morph, si, [b], "b")[0];
        }
        if (alpha < 1) {
          if (vertical) {
            b = base + (end - base) * alpha;
          } else {
            const size = base - end;
            const h = size * alpha;
            b = end + size - h;
            a = b + h;
          }
        }
        const fill = (s.cells && s.cells[i]) || s.color;
        const active = s.activeIndex != null && s.activeIndex === i && s.activeBar;
        let attrs = `fill="${fill}"`;
        if (active) {
          const ab = s.activeBar;
          attrs += ` fill-opacity="${fmtF(ab.FillOpacity || 1)}" stroke="${ab.Stroke || fill}"`;
          if (ab.StrokeDasharray) attrs += ` stroke-dasharray="${fmtF(ab.StrokeDasharray)}"`;
          if (ab.StrokeDashoffset) attrs += ` stroke-dashoffset="${fmtF(ab.StrokeDashoffset)}"`;
          if (s.strokeWidth) attrs += ` stroke-width="${fmtF(s.strokeWidth)}"`;
        }
        let d;
        if (vertical) {
          const y = catStart + i * band + offsets[slot];
          const x = Math.min(a, b);
          d = roundedBarPath(x, y, Math.abs(b - a), barSize, s.radius);
        } else {
          const x = catStart + i * band + offsets[slot];
          const y = Math.min(a, b);
          d = roundedBarPath(x, y, barSize, Math.abs(b - a), s.radius);
        }
        tops.push(b);
        // Recharts anchors the rectangle at the value in the default
        // layout and at the baseline in a vertical one, so the size keeps
        // the sign of the value in both.
        rectPos.push(vertical ? a : b);
        rectSize.push(vertical ? b - a : a - b);
        rectA.push(a);
        rectB.push(b);
        svg += `<g class="recharts-layer recharts-bar-rectangle"><path ${attrs} d="${d}"/></g>`;
        if (m.stacked) stackBase[i] = to;
      }
      svg += "</g>";
      // Label lists paint after the entrance, like Recharts gates them on
      // isAnimationFinished.
      if (alpha >= 1 && s.labelLists) {
        for (const ll of s.labelLists) {
          svg += `<g class="recharts-layer recharts-label-list">`;
          for (let i = 0; i < n; i++) {
            const catCenter = catStart + i * band + offsets[slot] + barSize / 2;
            const offset = ll.offset || 5;
            // getAttrsOfCartesianLabel: the sign of the rectangle flips the
            // offset and the anchor, so a negative bar labels below its end.
            let x, y, anchor, vAnchor;
            if (vertical) {
              const width = rectSize[i];
              const sign = width >= 0 ? 1 : -1;
              y = catCenter;
              vAnchor = "middle";
              anchor = sign > 0 ? "start" : "end";
              x = ll.position === "right" ? rectPos[i] + width + sign * offset : rectPos[i] + sign * offset;
            } else {
              const height = rectSize[i];
              const sign = height >= 0 ? 1 : -1;
              x = catCenter;
              y = rectPos[i] - sign * offset;
              anchor = "middle";
              vAnchor = sign > 0 ? "end" : "start";
            }
            const fo = ll.fillOpacity ? ` fill-opacity="${fmtF(ll.fillOpacity)}"` : "";
            // LabelList inherits the entry's presentation props, so a label
            // without its own class takes the bar's fill.
            const fill = ll.class ? "" : ` fill="${(s.cells && s.cells[i]) || s.color}"`;
            svg += `<text x="${fmtF(x)}" y="${fmtF(y)}" class="recharts-text recharts-label ${ll.class || ""}" text-anchor="${anchor}" font-size="${fmtF(ll.fontSize || 12)}"${fill}${fo}><tspan dy="${verticalAnchorDy(vAnchor)}">${ll.labels[i]}</tspan></text>`;
          }
          svg += `</g>`;
        }
      }
      svg += "</g>";
      state.tops.push(tops);
      state.points.a.push(rectA);
      state.points.b.push(rectB);
    }
    xs = cats;
  } else if (m.kind === "line") {
    xs = cats;
    state.tops = [];
    for (let si = 0; si < m.series.length; si++) {
      const s = m.series[si];
      const top = morphPoints(state.morph, si, vals[si].map((v) => linearY(v - domainMin, domainMax - domainMin, plotY, plotH)), "tops");
      const d = curvePath(s.curve, xs, top);
      // The Recharts line entrance: strokeDasharray sweeps the measured
      // curve length from 0 to totalLength.
      let dash = "";
      if (alpha < 1) {
        const total = pathLength(d);
        dash = ` stroke-dasharray="${fmtF(total * alpha)}px ${fmtF(total - total * alpha)}px"`;
      }
      svg +=
        `<g class="recharts-layer recharts-line">` +
        `<path class="recharts-curve recharts-line-curve" stroke="${s.stroke || s.color}" stroke-width="${s.strokeWidth || 1}" fill="none"${dash} d="${d}"/>`;
      // Dots and labels appear when the entrance finished, like Recharts'
      // isAnimationFinished gate on renderDots and LabelList.
      if (alpha >= 1 && s.dot) {
        svg += `<g class="recharts-layer recharts-line-dots">`;
        for (let i = 0; i < n; i++) {
          if (s.dot.icon) {
            const size = s.dot.size || 24;
            svg += `<g transform="translate(${fmtF(xs[i] - size / 2)},${fmtF(top[i] - size / 2)})">${s.dot.icon}</g>`;
          } else {
            const fill = (s.dot.fills && s.dot.fills[i]) || s.dot.fill || "#fff";
            const stroke = (s.dot.fills && s.dot.fills[i]) || s.stroke || s.color;
            svg += `<circle r="${fmtF(s.dot.r || 3)}" stroke="${stroke}" stroke-width="${s.strokeWidth || 1}" fill="${fill}" class="recharts-dot recharts-line-dot" cx="${fmtF(xs[i])}" cy="${fmtF(top[i])}"/>`;
          }
        }
        svg += `</g>`;
      }
      if (alpha >= 1 && s.labelList) {
        const ll = s.labelList;
        svg += `<g class="recharts-layer recharts-label-list">`;
        for (let i = 0; i < n; i++) {
          const fill = ll.class ? "" : ` fill="${s.stroke || s.color}"`;
          svg += `<text x="${fmtF(xs[i])}" y="${fmtF(top[i] - (ll.offset || 5))}" class="recharts-text recharts-label ${ll.class || ""}" text-anchor="middle" font-size="${fmtF(ll.fontSize || 12)}"${fill}><tspan>${ll.labels[i]}</tspan></text>`;
        }
        svg += `</g>`;
      }
      svg += `</g>`;
      state.tops.push(top);
    }
  } else {
    xs = cats;
    // Recharts' entrance animation reveals areas left to right through a
    // clipPath rect (AreaRevealShape).
    const baseline = new Array(n).fill(plotBottom);
    let base = baseline;
    state.tops = [];
    for (let si = 0; si < m.series.length; si++) {
      const s = m.series[si];
      const top = morphPoints(
        state.morph,
        si,
        m.stacked
          ? base.map((b, i) => b - ((vals[si][i] / (domainMax - domainMin)) * plotH || 0))
          : vals[si].map((v) => linearY(v - domainMin, domainMax - domainMin, plotY, plotH)),
        "tops"
      );
      const fill = (s.fill || "").replace("url(#", `url(#${state.uid}-`) || s.color;
      const fillOpacity = s.fillOpacity || 0.6;
      const areaD = m.stacked ? areaPathBetween(s.curve, xs, top, base) : areaPathBetween(s.curve, xs, top, baseline);
      // HorizontalRect: the reveal spans the point range and reaches the
      // lowest painted y plus the stroke width.
      let clip = "";
      let clipOpen = "";
      if (alpha < 1) {
        const width = alpha * Math.abs(xs[0] - xs[n - 1]);
        const maxY = Math.max(...top, ...(m.stacked ? base : baseline));
        const id = `${state.uid}-reveal-${si}`;
        clip = `<defs><clipPath id="${id}"><rect x="${fmtF(xs[0] < xs[n - 1] ? xs[0] : xs[0] - width)}" y="0" width="${fmtF(width)}" height="${fmtF(Math.floor(maxY + 1))}"/></clipPath></defs>`;
        clipOpen = ` clip-path="url(#${id})"`;
      }
      svg +=
        clip +
        `<g class="recharts-layer recharts-area"${clipOpen}>` +
        `<path class="recharts-curve recharts-area-area" fill="${fill}" fill-opacity="${fillOpacity}" stroke="none" d="${areaD}"/>` +
        `<path class="recharts-curve recharts-area-curve" stroke="${s.stroke || s.color}" fill="none" stroke-width="1" d="${curvePath(s.curve, xs, top)}"/>` +
        `</g>`;
      state.tops.push(top);
      if (m.stacked) base = top;
    }
  }

  // The x axis only renders when the chart declared a visible one.
  if (m.xAxisHeight && !vertical) {
  const widths = m.labels.map((l) => measureLabel(l, panel));
  const labelY = plotBottom + TICK_SIZE + (m.tickMargin || 0);
  svg += `<g class="recharts-layer recharts-cartesian-axis recharts-xAxis xAxis">`;
  if (m.xAxisLine) {
    svg += `<line orientation="bottom" class="recharts-cartesian-axis-line" stroke="#666" fill="none" x1="${fmtF(plotX)}" y1="${fmtF(plotBottom)}" x2="${fmtF(plotX + plotW)}" y2="${fmtF(plotBottom)}"/>`;
  }
  svg += `<g class="recharts-cartesian-axis-ticks">`;
  for (const tk of preserveEndTicks(xs, widths, 0, W, m.minTickGap || 5)) {
    svg += `<g class="recharts-layer recharts-cartesian-axis-tick">`;
    if (m.xTickLine) {
      svg += `<line orientation="bottom" class="recharts-cartesian-axis-tick-line" stroke="#666" fill="none" x1="${fmtF(xs[tk.index])}" y1="${fmtF(plotBottom + TICK_SIZE)}" x2="${fmtF(xs[tk.index])}" y2="${fmtF(plotBottom)}"/>`;
    }
    svg += `<text orientation="bottom" height="${fmtF(m.xAxisHeight)}" x="${fmtF(tk.coord)}" y="${fmtF(labelY)}" stroke="none" fill="#666" class="recharts-text recharts-cartesian-axis-tick-value" text-anchor="middle"><tspan dy="0.71em">${m.labels[tk.index]}</tspan></text></g>`;
  }
  svg += "</g></g>";
  }
  svg += "</svg>";

  swapSVG(panel, svg);

  state.points.tops = state.tops || [];
  state.geom = { W, H, plotX, plotY, plotW, plotH, plotBottom, band, xs, cats, n, vertical };
}

/* Pie sector path, the port of the Go SectorPath (degrees, 0 at three
 * o'clock, counterclockwise positive). */
/* useElementOffset and setLegendSize: the legend reports its rendered
 * bounding box, and appendOffsetOfLegend takes that height off the chart.
 * The model height is the fallback until the legend has been laid out. */
function legendSize(panel, m) {
  if (!m.legendHeight) return 0;
  const el = panel.querySelector(".recharts-legend-wrapper");
  if (el) {
    const h = el.getBoundingClientRect().height;
    if (h > 0) return h;
  }
  return m.legendHeight;
}

/* polarToCartesian of Recharts: degrees, zero at three o'clock, positive
 * counterclockwise. */
function polarToCartesian(cx, cy, radius, angle) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + Math.cos(rad) * radius, y: cy - Math.sin(rad) * radius };
}

/* getAngleOfPoint of Recharts' PolarUtils: the polar coordinates of a
 * point around the chart center. */
function angleOfPoint(x, y, cx, cy) {
  const radius = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  if (radius <= 0) return { radius, angle: 0 };
  let angleInRadian = Math.acos((x - cx) / radius);
  if (y > cy) angleInRadian = 2 * Math.PI - angleInRadian;
  return { radius, angle: (angleInRadian * 180) / Math.PI };
}

/* calculateActiveTickIndex for an angle axis that spans a full circle:
 * the pointer belongs to the tick whose half intervals contain it. */
function activeAngleIndex(coordinate, ticks) {
  const len = ticks.length;
  if (len <= 1) return 0;
  const range = [90, -270];
  for (let i = 0; i < len; i++) {
    const before = i > 0 ? ticks[i - 1] : ticks[len - 1];
    const cur = ticks[i];
    const after = i >= len - 1 ? ticks[0] : ticks[i + 1];
    const sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
    let sameDirectionCoord;
    if (sign(cur - before) !== sign(after - cur)) {
      const diffInterval = [];
      if (sign(after - cur) === sign(range[1] - range[0])) {
        sameDirectionCoord = after;
        const curInRange = cur + range[1] - range[0];
        diffInterval[0] = Math.min(curInRange, (curInRange + before) / 2);
        diffInterval[1] = Math.max(curInRange, (curInRange + before) / 2);
      } else {
        sameDirectionCoord = before;
        const afterInRange = after + range[1] - range[0];
        diffInterval[0] = Math.min(cur, (afterInRange + cur) / 2);
        diffInterval[1] = Math.max(cur, (afterInRange + cur) / 2);
      }
      const sameInterval = [Math.min(cur, (sameDirectionCoord + cur) / 2), Math.max(cur, (sameDirectionCoord + cur) / 2)];
      if ((coordinate > sameInterval[0] && coordinate <= sameInterval[1]) || (coordinate >= diffInterval[0] && coordinate <= diffInterval[1])) {
        return i;
      }
    } else {
      const minValue = Math.min(before, after);
      const maxValue = Math.max(before, after);
      if (coordinate > (minValue + cur) / 2 && coordinate <= (maxValue + cur) / 2) {
        return i;
      }
    }
  }
  return -1;
}

/* getPolygonPath of Recharts' PolarGrid. */
function polarPolygonPath(radius, cx, cy, angles) {
  let path = "";
  angles.forEach((angle, i) => {
    const p = polarToCartesian(cx, cy, radius, angle);
    path += (i ? "L " : "M ") + fmtF(p.x) + "," + fmtF(p.y);
  });
  return path + "Z";
}

/* renderRadar draws a RadarChart: the polar grid, the angle axis labels and
 * one polygon per series. The geometry follows RadarChart's defaults, a
 * start angle of 90 running to -270 and an outer radius of 80%. */
function renderRadar(panel, m, state, alpha = 1) {
  const W = panel.clientWidth;
  const H = panel.clientHeight;
  if (!W || !H) return;
  const legendHeight = legendSize(panel, m);
  const offsetW = Math.max(W - m.marginLeft - m.marginRight, 0);
  const offsetH = Math.max(H - m.marginTop - m.marginBottom - legendHeight, 0);
  const cx = m.marginLeft + offsetW / 2;
  const cy = m.marginTop + offsetH / 2;
  const maxRadius = Math.min(offsetW, offsetH) / 2;
  const outerRadius = maxRadius * 0.8;
  const n = m.series.length ? m.series[0].values.length : 0;
  if (!n) return;

  // The angle axis is a band scale from 90 to -270, one tick per row.
  const step = -360 / n;
  const angles = Array.from({ length: n }, (_, i) => 90 + step * i);
  const ticks = domainTicks(m, m.tickCount || 5);
  const domainMax = ticks[ticks.length - 1];
  const polar = m.polar || {};
  const radii = polar.polarRadius && polar.polarRadius.length ? polar.polarRadius : ticks.map((t) => (t / domainMax) * outerRadius);

  let svg = `<svg class="recharts-surface" width="${fmtF(W)}" height="${fmtF(H)}" viewBox="0 0 ${fmtF(W)} ${fmtF(H)}">`;

  if (polar.hasGrid) {
    const strokeWidth = polar.strokeWidth ? ` stroke-width="${fmtF(polar.strokeWidth)}"` : "";
    const cls = polar.gridClass ? " " + polar.gridClass : "";
    svg += `<g class="recharts-polar-grid"><g class="recharts-polar-grid-concentric">`;
    for (const r of radii) {
      if (polar.gridType === "circle") {
        svg += `<circle class="recharts-polar-grid-concentric-circle${cls}" stroke="#ccc" fill="none"${strokeWidth} cx="${fmtF(cx)}" cy="${fmtF(cy)}" r="${fmtF(r)}"/>`;
      } else {
        svg += `<path class="recharts-polar-grid-concentric-polygon${cls}" stroke="#ccc" fill="none"${strokeWidth} d="${polarPolygonPath(r, cx, cy, angles)}"/>`;
      }
    }
    svg += `</g>`;
    if (polar.radialLines) {
      svg += `<g class="recharts-polar-grid-angle">`;
      for (const a of angles) {
        const start = polarToCartesian(cx, cy, 0, a);
        const end = polarToCartesian(cx, cy, outerRadius, a);
        svg += `<line stroke="#ccc"${strokeWidth} x1="${fmtF(start.x)}" y1="${fmtF(start.y)}" x2="${fmtF(end.x)}" y2="${fmtF(end.y)}"/>`;
      }
      svg += `</g>`;
    }
    svg += `</g>`;
  }

  if (polar.hasAngleAxis) {
    // getTickLineCoord with the default tickSize of 8 and the outer
    // orientation, plus getTickTextAnchor and getTickTextVerticalAnchor.
    const eps = 1e-5;
    const COS_45 = Math.cos((45 * Math.PI) / 180);
    svg += `<g class="recharts-polar-angle-axis recharts-axis">`;
    // AxisLine: a polygon through the ticks at the outer radius, the
    // default axisLineType of "polygon".
    svg += `<path class="recharts-polygon recharts-polar-angle-axis-line" fill="none" d="${polarPolygonPath(outerRadius, cx, cy, angles)}"/>`;
    svg += `<g class="recharts-polar-angle-axis-ticks">`;
    for (let i = 0; i < n; i++) {
      const coord = angles[i];
      const p = polarToCartesian(cx, cy, outerRadius + 8, coord);
      const cos = Math.cos((-coord * Math.PI) / 180);
      const sin = Math.sin((-coord * Math.PI) / 180);
      const anchor = cos > eps ? "start" : cos < -eps ? "end" : "middle";
      const vAnchor = Math.abs(cos) <= COS_45 ? (sin > 0 ? "start" : "end") : "middle";
      // getTickLineCoord: from the axis out by the default tickSize of 8.
      const p1 = polarToCartesian(cx, cy, outerRadius, coord);
      svg += `<line class="recharts-polar-angle-axis-tick-line" fill="none" x1="${fmtF(p1.x)}" y1="${fmtF(p1.y)}" x2="${fmtF(p.x)}" y2="${fmtF(p.y)}"/>`;
      const custom = polar.ticks && polar.ticks[i];
      if (custom) {
        const y = p.y + (custom.offsetY || 0);
        const fs = custom.fontSize ? ` font-size="${fmtF(custom.fontSize)}"` : "";
        const fw = custom.fontWeight ? ` font-weight="${custom.fontWeight}"` : "";
        svg += `<text class="recharts-text recharts-polar-angle-axis-tick-value" x="${fmtF(p.x)}" y="${fmtF(y)}" text-anchor="${anchor}"${fs}${fw} fill="currentColor">`;
        for (const span of custom.spans) {
          const attrs =
            (span.resetX ? ` x="${fmtF(p.x)}"` : "") +
            (span.dy ? ` dy="${span.dy}"` : "") +
            (span.fontSize ? ` font-size="${fmtF(span.fontSize)}"` : "") +
            (span.class ? ` class="${span.class}"` : "");
          svg += `<tspan${attrs}>${span.text}</tspan>`;
        }
        svg += `</text>`;
      } else {
        svg += `<text class="recharts-text recharts-polar-angle-axis-tick-value" x="${fmtF(p.x)}" y="${fmtF(p.y)}" text-anchor="${anchor}" fill="#666"><tspan dy="${verticalAnchorDy(vAnchor)}">${m.labels[i]}</tspan></text>`;
      }
    }
    svg += `</g></g>`;
  }

  state.tops = [];
  state.points = { radar: [] };
  const morph = state.morph;
  for (let si = 0; si < m.series.length; si++) {
    const s = m.series[si];
    // interpolatePolarPoint: the points grow out of the center on mount and
    // interpolate from the previous points on an update.
    const prev = morph && morph.prev && morph.prev.radar ? morph.prev.radar[si] : null;
    const factor = prev ? prev.length / s.values.length : 0;
    const pts = s.values.map((v, i) => {
      const target = polarToCartesian(cx, cy, (v / domainMax) * outerRadius, angles[i]);
      if (morph) {
        const p = prev && prev[Math.floor(i * factor)];
        if (p) return { x: interpolate(p.x, target.x, morph.t), y: interpolate(p.y, target.y, morph.t) };
        return { x: interpolate(cx, target.x, morph.t), y: interpolate(cy, target.y, morph.t) };
      }
      if (alpha < 1) {
        return { x: interpolate(cx, target.x, alpha), y: interpolate(cy, target.y, alpha) };
      }
      return target;
    });
    const d = pts.map((p, i) => (i ? "L" : "M") + fmtF(p.x) + "," + fmtF(p.y)).join("") + "Z";
    // filterProps only forwards the props that are set, so an unset fill
    // opacity leaves the SVG default of 1 in place.
    const fillOpacity = s.fillOpacityPtr != null ? ` fill-opacity="${fmtF(s.fillOpacityPtr)}"` : "";
    const stroke = s.stroke ? ` stroke="${s.stroke}"` : "";
    const strokeWidth = s.strokeWidth ? ` stroke-width="${fmtF(s.strokeWidth)}"` : "";
    svg +=
      `<g class="recharts-layer recharts-radar">` +
      `<g class="recharts-radar-polygon">` +
      `<path class="recharts-polygon" fill="${s.fill || s.color}"${fillOpacity}${stroke}${strokeWidth} d="${d}"/>`;
    // StaticPolygon renders the dots together with the polygon, so they
    // travel with it during the animation.
    if (s.dot) {
      svg += `<g class="recharts-radar-dots">`;
      for (const p of pts) {
        const dotOpacity = s.dot.fillOpacity ? ` fill-opacity="${fmtF(s.dot.fillOpacity)}"` : "";
        svg += `<circle class="recharts-dot recharts-radar-dot" r="${fmtF(s.dot.r || 3)}" fill="${s.dot.fill || s.fill || s.color}"${dotOpacity}${stroke} cx="${fmtF(p.x)}" cy="${fmtF(p.y)}"/>`;
      }
      svg += `</g>`;
    }
    svg += `</g></g>`;
    state.tops.push(pts.map((p) => p.y));
    state.points.radar.push(pts);
  }

  svg += "</svg>";
  swapSVG(panel, svg);
  state.geom = { W, H, cx, cy, outerRadius, angles, n };
}

/* getSectorPath of Recharts' Sector. */
function sectorPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  // getDeltaAngle clamps a sector to a full turn.
  const sign = endAngle - startAngle < 0 ? -1 : 1;
  const angle = Math.min(Math.abs(endAngle - startAngle), 360) * sign;
  const tempEndAngle = startAngle + angle;
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, tempEndAngle);
  const large = Math.abs(angle) > 180 ? 1 : 0;
  let path =
    `M ${fmtF(outerStart.x)},${fmtF(outerStart.y)} A ${fmtF(outerR)},${fmtF(outerR)},0,${large},` +
    `${startAngle > tempEndAngle ? 1 : 0},${fmtF(outerEnd.x)},${fmtF(outerEnd.y)}`;
  if (innerR > 0) {
    const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
    const innerEnd = polarToCartesian(cx, cy, innerR, tempEndAngle);
    path +=
      `L ${fmtF(innerEnd.x)},${fmtF(innerEnd.y)} A ${fmtF(innerR)},${fmtF(innerR)},0,${large},` +
      `${startAngle <= tempEndAngle ? 1 : 0},${fmtF(innerStart.x)},${fmtF(innerStart.y)} Z`;
  } else {
    path += `L ${fmtF(cx)},${fmtF(cy)} Z`;
  }
  return path;
}

/* getTextAnchor of Pie's labels. */
function pieTextAnchor(x, cx) {
  if (x > cx) return "start";
  if (x < cx) return "end";
  return "middle";
}

const PIE_LABEL_OFFSET = 20;

function renderPie(panel, m, state, alpha = 1) {
  const W = panel.clientWidth;
  const H = panel.clientHeight;
  if (!W || !H) return;
  // The Pie defaults: centered in the offset box, 80% of its radius. The
  // legend adds to the bottom offset, so it shrinks the pie instead of
  // covering it.
  const margin = 5;
  const offsetW = Math.max(W - 2 * margin, 0);
  const offsetH = Math.max(H - 2 * margin - legendSize(panel, m), 0);
  const cx = margin + offsetW / 2;
  const cy = margin + offsetH / 2;
  const maxR = Math.min(offsetW, offsetH) / 2;

  let svg = `<svg class="recharts-surface" width="${fmtF(W)}" height="${fmtF(H)}" viewBox="0 0 ${fmtF(W)} ${fmtF(H)}">`;
  state.points = { sectors: [] };

  (m.pies || []).forEach((pie, pi) => {
    const outerR = pie.outerRadius || maxR * 0.8;
    const innerR = pie.innerRadius || 0;
    const total = pie.values.reduce((a, b) => a + b, 0);
    const stroke = pie.stroke === "0" ? "" : ` stroke="${pie.stroke || "#fff"}"`;
    const strokeWidth = pie.strokeWidth ? ` stroke-width="${fmtF(pie.strokeWidth)}"` : "";
    const sectors = [];
    // The Pie animation: every sector interpolates its own angle and they
    // chain. On mount it starts at zero, on an update it starts at the
    // previous sector's angle.
    const morph = state.morph;
    const prevSectors = morph && morph.prev && morph.prev.sectors ? morph.prev.sectors[pi] : null;
    let angle = 0;
    for (let i = 0; i < pie.values.length; i++) {
      const target = (pie.values[i] / total) * 360 * alpha;
      let sweep = target;
      if (prevSectors && prevSectors[i]) {
        sweep = interpolate(prevSectors[i].end - prevSectors[i].start, target, morph.t);
      }
      sectors.push({ start: angle, end: angle + sweep, mid: angle + sweep / 2 });
      angle += sweep;
    }

    svg += `<g class="recharts-layer recharts-pie">`;
    for (let i = 0; i < sectors.length; i++) {
      const sc = sectors[i];
      const fill = pie.colors[i];
      const active = pie.activeIndex != null && pie.activeIndex === i && pie.activeShape && pie.activeShape.length;
      const shapes = active
        ? pie.activeShape.map((sp) => ({ inner: sp.InnerRadius ? outerR + sp.InnerRadius : innerR, outer: outerR + (sp.OuterRadius || 0) }))
        : [{ inner: innerR, outer: outerR }];
      svg += `<g class="recharts-layer recharts-pie-sector">`;
      for (const sh of shapes) {
        svg += `<path class="recharts-sector"${stroke}${strokeWidth} fill="${fill}" data-tui-chart-pie="${pi}" data-tui-chart-sector="${i}" d="${sectorPath(cx, cy, sh.inner, sh.outer, sc.start, sc.end)}"/>`;
      }
      svg += `</g>`;
    }

    // PieLabels: the label sits offsetRadius past the sector, the line
    // runs from the sector edge to it.
    if (alpha >= 1 && pie.label) {
      svg += `<g class="recharts-layer recharts-pie-labels">`;
      for (let i = 0; i < sectors.length; i++) {
        const mid = sectors[i].mid;
        const endPoint = polarToCartesian(cx, cy, outerR + PIE_LABEL_OFFSET, mid);
        const fill = pie.label.fill || pie.colors[i];
        if (pie.labelLine) {
          const startPoint = polarToCartesian(cx, cy, outerR, mid);
          svg += `<path class="recharts-curve recharts-pie-label-line" stroke="${pie.colors[i]}" fill="none" d="M${fmtF(startPoint.x)},${fmtF(startPoint.y)}L${fmtF(endPoint.x)},${fmtF(endPoint.y)}"/>`;
        }
        svg += `<text class="recharts-text recharts-pie-label-text" x="${fmtF(endPoint.x)}" y="${fmtF(endPoint.y)}" fill="${fill}" text-anchor="${pieTextAnchor(endPoint.x, cx)}" alignment-baseline="middle">${fmtF(pie.values[i])}</text>`;
      }
      svg += `</g>`;
    }

    // A LabelList on a Pie is a polar label: it sits at the middle radius
    // of its sector.
    if (alpha >= 1 && pie.labelList) {
      const ll = pie.labelList;
      svg += `<g class="recharts-layer recharts-label-list">`;
      for (let i = 0; i < sectors.length; i++) {
        const r = (innerR + outerR) / 2;
        const pt = polarToCartesian(cx, cy, r, sectors[i].mid);
        svg += `<text class="recharts-text recharts-label ${ll.class || ""}" x="${fmtF(pt.x)}" y="${fmtF(pt.y)}" text-anchor="middle" font-size="${fmtF(ll.fontSize || 12)}"><tspan dy="0.355em">${ll.labels[i]}</tspan></text>`;
      }
      svg += `</g>`;
    }

    if (pie.centerValue) {
      svg +=
        `<text x="${fmtF(cx)}" y="${fmtF(cy)}" text-anchor="middle" dominant-baseline="middle">` +
        `<tspan x="${fmtF(cx)}" y="${fmtF(cy)}" class="fill-foreground text-3xl font-bold">${pie.centerValue}</tspan>` +
        `<tspan x="${fmtF(cx)}" y="${fmtF(cy + 24)}" class="fill-muted-foreground">${pie.centerLabel}</tspan>` +
        `</text>`;
    }
    svg += "</g>";
    state.points.sectors.push(sectors);
  });

  svg += "</svg>";
  swapSVG(panel, svg);
  state.geom = { W, H };
}

/* ---------------------------------------------------------------- */
/* Tooltip + cursor                                                 */
/* ---------------------------------------------------------------- */

function tooltipWrapper(container) {
  let wrapper = container.querySelector(":scope > .recharts-tooltip-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "recharts-tooltip-wrapper";
    wrapper.style.cssText =
      "position:absolute;top:0;left:0;pointer-events:none;visibility:hidden;z-index:30;transition:transform 400ms ease";
    container.style.position = "relative";
    container.appendChild(wrapper);
  }
  return wrapper;
}

function indicatorHTML(indicator, color) {
  let cls = "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)";
  if (indicator === "line") cls += " w-1";
  else if (indicator === "dashed") cls += " w-0 border-[1.5px] border-dashed bg-transparent";
  else cls += " h-2.5 w-2.5";
  return `<div class="${cls}" style="--color-bg:${color};--color-border:${color}"></div>`;
}

function tooltipHTML(m, i, pieIndex = 0) {
  const t = m.tooltip || {};
  // labelKey resolves the label through the config, otherwise the row's
  // own label is used.
  const label = t.label || (m.kind === "pie" ? "" : (m.tooltipLabels && m.tooltipLabels[i]) || m.labels[i]);
  // Like ChartTooltipContent: a single non-dot series nests the label
  // inside the row, so the line indicator spans the full row height.
  const nestLabel = m.kind !== "pie" && m.series.length === 1 && t.indicator && t.indicator !== "dot";
  let html = `<div class="${TOOLTIP_CLASS}${t.width ? " " + t.width : ""}">`;
  if (!t.hideLabel && !nestLabel) {
    html += `<div class="font-medium">${label}</div>`;
  }
  html += `<div class="grid gap-1.5">`;
  if (m.kind === "pie") {
    const pie = m.pies[pieIndex];
    if (t.label && !t.hideLabel) {
      html = html.replace('<div class="grid gap-1.5">', `<div class="font-medium">${pie.seriesLabel || t.label}</div><div class="grid gap-1.5">`);
    }
    const color = pie.colors[i];
    const rowCls =
      "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground" +
      (t.indicator !== "line" && t.indicator !== "dashed" ? " items-center" : "");
    html +=
      `<div class="${rowCls}">` +
      (t.hideIndicator ? "" : indicatorHTML(t.indicator, color)) +
      `<div class="flex flex-1 justify-between leading-none items-center">` +
      `<div class="grid gap-1.5"><span class="text-muted-foreground">${(pie.tooltipNames && pie.tooltipNames[i]) || pie.labels[i]}</span></div>` +
      `<span class="font-mono font-medium text-foreground tabular-nums">${pie.values[i].toLocaleString("en-US")}</span>` +
      `</div></div></div></div>`;
    return html;
  }
  for (const s of m.series) {
    const rowCls =
      "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground" +
      (t.indicator !== "line" && t.indicator !== "dashed" ? " items-center" : "");
    const nested = nestLabel && !t.hideLabel ? `<div class="font-medium">${label}</div>` : "";
    // ChartTooltipContent's indicatorColor: the row's own fill wins over
    // the series color, so per row colored bars keep their swatch.
    const indicatorColor = (s.cells && s.cells[i]) || s.color;
    html +=
      `<div class="${rowCls}">` +
      (t.hideIndicator ? "" : s.icon || indicatorHTML(t.indicator, indicatorColor)) +
      `<div class="flex flex-1 justify-between leading-none ${nestLabel ? "items-end" : "items-center"}">` +
      `<div class="grid gap-1.5">${nested}<span class="text-muted-foreground">${s.label}</span></div>` +
      `<span class="font-mono font-medium text-foreground tabular-nums">${s.values[i].toLocaleString("en-US")}</span>` +
      `</div></div>`;
  }
  html += "</div></div>";
  return html;
}

function showCursor(panel, m, state, i) {
  const svg = panel.querySelector("svg.recharts-surface");
  if (!svg || m.cursor === false) return;
  let cursor = svg.querySelector(".recharts-tooltip-cursor");
  const g = state.geom;
  // Recharts draws the cursor between the grid and the series, so bars
  // and areas render on top of the hover band.
  const seriesLayer = svg.querySelector(".recharts-bar, .recharts-area, .recharts-line, .recharts-radar");
  if (m.kind === "radar") {
    const end = polarToCartesian(g.cx, g.cy, g.outerRadius, g.angles[i]);
    const d = `M${fmtF(g.cx)},${fmtF(g.cy)}L${fmtF(end.x)},${fmtF(end.y)}`;
    if (!cursor) {
      seriesLayer.insertAdjacentHTML("beforebegin", `<g class="recharts-layer"><path class="recharts-curve recharts-tooltip-cursor" stroke="#ccc" fill="none" d="${d}"/></g>`);
    } else {
      cursor.setAttribute("d", d);
    }
    return;
  }
  if (m.kind === "bar") {
    const d = g.vertical
      ? `M ${fmtF(g.plotX)},${fmtF(g.plotY + i * g.band)} h ${fmtF(g.plotW)} v ${fmtF(g.band)} h ${fmtF(-g.plotW)} Z`
      : `M ${fmtF(g.plotX + i * g.band)},${fmtF(g.plotY)} h ${fmtF(g.band)} v ${fmtF(g.plotH)} h ${fmtF(-g.band)} Z`;
    if (!cursor) {
      seriesLayer.insertAdjacentHTML(
        "beforebegin",
        `<g class="recharts-layer"><path class="recharts-rectangle recharts-tooltip-cursor" fill="#ccc" d="${d}"/></g>`
      );
    } else {
      cursor.setAttribute("d", d);
    }
  } else {
    const x = g.xs[i];
    const d = `M${fmtF(x)},${fmtF(g.plotY)}L${fmtF(x)},${fmtF(g.plotBottom)}`;
    if (!cursor) {
      seriesLayer.insertAdjacentHTML(
        "beforebegin",
        `<g class="recharts-layer"><path class="recharts-curve recharts-tooltip-cursor" stroke="#ccc" fill="none" stroke-width="1" d="${d}"/></g>`
      );
    } else {
      cursor.setAttribute("d", d);
    }
  }
}

function hideCursor(panel) {
  const cursor = panel.querySelector(".recharts-tooltip-cursor");
  if (cursor) cursor.parentElement.remove();
  hideActiveDots(panel);
}

// showActiveDots is Recharts' Area/Line activeDot: a dot per series on the
// active data point while the tooltip is up.
function showActiveDots(panel, m, state, i) {
  const svg = panel.querySelector("svg.recharts-surface");
  if (!svg || (m.kind !== "area" && m.kind !== "line" && m.kind !== "radar") || !state.tops) return;
  let layer = svg.querySelector(".recharts-active-dots");
  if (!layer) {
    svg.insertAdjacentHTML("beforeend", `<g class="recharts-layer recharts-active-dots"></g>`);
    layer = svg.querySelector(".recharts-active-dots");
  }
  let html = "";
  for (let s = 0; s < m.series.length; s++) {
    // renderActivePoint's defaults: r 4, white stroke of 2, filled with the
    // item's main color. getLegendItemColor prefers the stroke over the fill.
    const series = m.series[s];
    const r = series.activeDotR || 4;
    const mainColor = series.stroke && series.stroke !== "none" ? series.stroke : series.fill || series.color || "none";
    // A radar point carries its own x, the cartesian charts share the
    // category positions.
    const point = m.kind === "radar" ? state.points.radar[s][i] : { x: state.geom.xs[i], y: state.tops[s][i] };
    html += `<circle class="recharts-dot" r="${fmtF(r)}" stroke="#fff" stroke-width="2" fill="${mainColor}" cx="${fmtF(point.x)}" cy="${fmtF(point.y)}"/>`;
  }
  layer.innerHTML = html;
}

function hideActiveDots(panel) {
  const layer = panel.querySelector(".recharts-active-dots");
  if (layer) layer.remove();
}

/* ---------------------------------------------------------------- */
/* Wiring                                                           */
/* ---------------------------------------------------------------- */

const OFFSET = 10;

/* getTooltipTranslateXY: the tooltip sits after the coordinate, and flips
 * before it once it would leave the view box, clamped to the view box. */
function tooltipTranslate(coordinate, tooltipDimension, viewBoxKey, viewBoxDimension) {
  const negative = coordinate - tooltipDimension - (OFFSET > 0 ? OFFSET : 0);
  const positive = coordinate + OFFSET;
  const tooltipBoundary = positive + tooltipDimension;
  const viewBoxBoundary = viewBoxKey + viewBoxDimension;
  if (tooltipBoundary > viewBoxBoundary) {
    return Math.max(negative, viewBoxKey);
  }
  return Math.max(positive, viewBoxKey);
}

function initPanel(script) {
  if (script.dataset.tuiChartInit) return;
  script.dataset.tuiChartInit = "true";

  const panel = script.parentElement;
  const container = panel.closest("[data-tui-chart]");
  const m = JSON.parse(script.textContent);
  const state = { uid: "tui-chart-" + uid++ };

  const render = (alpha = 1) => {
    if (m.kind === "pie") renderPie(panel, m, state, alpha);
    else if (m.kind === "radar") renderRadar(panel, m, state, alpha);
    else renderCartesian(panel, m, state, alpha);
    // The points this panel drew are what the next visible panel morphs
    // from, Recharts' previousPointsRef.
    if (state.points) container._tuiActivePoints = state.points;
  };

  // On mount the entrance animation plays. When a hidden panel becomes
  // visible (range/series/month switches) Recharts morphs from the old
  // to the new values instead, so we interpolate from the previously
  // visible panel's model when the shapes line up. Plain resizes
  // re-render without animating.
  const enter = () => {
    const prev = container._tuiActive;
    const prevPoints = container._tuiActivePoints;
    container._tuiActive = m;
    const sameShape =
      m.kind === "pie"
        ? prev && prev.pies && m.pies && prev.pies.length === m.pies.length
        : prev && prev.series && m.series && prev.series.length === m.series.length;
    if (prev && prev !== m && prevPoints && prev.kind === m.kind && sameShape) {
      morphChart(panel, m, state, render, prevPoints);
    } else {
      animateChart(panel, m, state, render);
    }
  };
  if (panel.clientWidth) {
    state.mounted = true;
    enter();
  }
  const ro = new ResizeObserver(() => {
    const w = panel.clientWidth;
    if (!w) {
      state.mounted = false;
      return;
    }
    if (!state.mounted) {
      state.mounted = true;
      enter();
    } else if (!state.geom || w !== state.geom.W) {
      // Real container resizes re-render statically. state.geom.W is
      // updated on every animation frame, so a late observer callback
      // never stomps into a running animation.
      render(1);
    }
  });
  ro.observe(panel);

  const wrapper = tooltipWrapper(container);

  // Like Recharts' inRange: the tooltip only activates while the pointer
  // is inside the plot rectangle, not over the axis labels below.
  const activeIndexAt = (chartX, chartY) => {
    const g = state.geom;
    if (!g) return -1;
    if (m.kind === "radar") {
      // inRangeOfSector: only inside the outer radius, then the angle
      // decides which tick is active.
      const p = angleOfPoint(chartX, chartY, g.cx, g.cy);
      if (p.radius > g.outerRadius) return -1;
      // The angles run from 90 downwards, the point angle from 0 to 360.
      const angle = p.angle > 90 ? p.angle - 360 : p.angle;
      return activeAngleIndex(angle, g.angles);
    }
    if (chartX < g.plotX || chartX > g.plotX + g.plotW) return -1;
    if (chartY < g.plotY || chartY > g.plotBottom) return -1;
    if (m.kind === "bar") {
      // The category runs down the y axis in a vertical layout.
      const along = g.vertical ? chartY - g.plotY : chartX - g.plotX;
      return Math.max(0, Math.min(g.n - 1, Math.floor(along / g.band)));
    }
    const step = g.plotW / (g.n - 1);
    return Math.max(0, Math.min(g.n - 1, Math.round((chartX - g.plotX) / step)));
  };

  panel.addEventListener("pointermove", (e) => {
    if (m.kind === "pie") {
      const sector = e.target.closest(".recharts-sector");
      const idx = sector ? parseInt(sector.getAttribute("data-tui-chart-sector") || "-1", 10) : -1;
      if (idx < 0) {
        wrapper.style.visibility = "hidden";
        return;
      }
      positionTooltip(e, null, null, idx, parseInt(sector.getAttribute("data-tui-chart-pie") || "0", 10));
      return;
    }
    const rect = panel.getBoundingClientRect();
    const chartX = e.clientX - rect.left;
    const chartY = e.clientY - rect.top;
    const i = activeIndexAt(chartX, chartY);
    if (i < 0) {
      wrapper.style.visibility = "hidden";
      hideCursor(panel);
      return;
    }
    showCursor(panel, m, state, i);
    showActiveDots(panel, m, state, i);
    // getActiveCoordinate: the category axis snaps to its tick and the
    // other one follows the pointer, so a vertical layout snaps y.
    const g = state.geom;
    if (m.kind === "radar") {
      positionTooltip(e, null, null, i);
      return;
    }
    const snap = g ? g.cats[i] : null;
    positionTooltip(e, g && g.vertical ? null : snap, g && g.vertical ? snap : null, i);
  });

  function positionTooltip(e, snapX, snapY, i, pieIndex = 0) {
    const wasHidden = wrapper.style.visibility !== "visible";
    wrapper.innerHTML = tooltipHTML(m, i, pieIndex);
    wrapper.style.visibility = "visible";
    const crect = container.getBoundingClientRect();
    const tw = wrapper.offsetWidth;
    const th = wrapper.offsetHeight;
    const prect = panel.getBoundingClientRect();
    const px = snapX != null ? snapX + (prect.left - crect.left) : e.clientX - crect.left;
    const py = snapY != null ? snapY + (prect.top - crect.top) : e.clientY - crect.top;
    const tx = tooltipTranslate(px, tw, 0, crect.width);
    const ty = tooltipTranslate(py, th, 0, crect.height);
    if (wasHidden) {
      // Appear in place like Recharts, the transition only trails while
      // the tooltip is already visible.
      wrapper.style.transition = "none";
      wrapper.style.transform = `translate(${tx}px, ${ty}px)`;
      void wrapper.offsetHeight;
      wrapper.style.transition = "transform 400ms ease";
      return;
    }
    wrapper.style.transform = `translate(${tx}px, ${ty}px)`;
  }

  panel.addEventListener("pointerleave", () => {
    wrapper.style.visibility = "hidden";
    hideCursor(panel);
  });
}

function init() {
  document.querySelectorAll("script[data-tui-chart-model]").forEach(initPanel);
}

/* Interactive demo wiring: selects and header buttons toggle the SSR
 * rendered variants of a chart. */
document.addEventListener("select-change", (e) => {
  const trigger = e.target instanceof Element && e.target.closest("[data-tui-chart-range-select], [data-tui-chart-month-select]");
  if (!trigger) return;
  const value = e.detail && e.detail.value;
  if (!value) return;
  const chart = trigger.closest("[data-slot=card]");
  if (!chart) return;
  const attr = trigger.hasAttribute("data-tui-chart-range-select") ? "data-tui-chart-range" : "data-tui-chart-month";
  chart.querySelectorAll(`[${attr}]`).forEach((el) => {
    el.hidden = el.getAttribute(attr) !== value;
  });
});

document.addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  const btn = e.target.closest("[data-tui-chart-series]");
  if (!btn) return;
  const chart = btn.closest("[data-slot=card]");
  if (!chart) return;
  const series = btn.getAttribute("data-tui-chart-series");
  chart.querySelectorAll("[data-tui-chart-series]").forEach((b) => {
    b.setAttribute("data-active", b === btn ? "true" : "false");
  });
  chart.querySelectorAll("[data-tui-chart-series-panel]").forEach((el) => {
    el.hidden = el.getAttribute("data-tui-chart-series-panel") !== series;
  });
});

// Setup on load and on mutations, the templUI convention: init is
// idempotent (every panel carries its own init flag), so any inserted
// node just re-runs the full scan, no matter what put it into the DOM.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.addedNodes.length) {
      init();
      return;
    }
  }
}).observe(document.documentElement, { childList: true, subtree: true });
