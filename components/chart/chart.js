/**
 * templUI chart - client runtime.
 *
 * The server renders Recharts-compatible SVG for the first paint; this
 * module is the pendant of Recharts' client behavior on top of it:
 * - ResponsiveContainer: re-render the chart at the container's real pixel
 *   size (ResizeObserver), so bars, radii and text keep their pixel sizes.
 * - Tooltip: absolutely positioned wrapper that trails the cursor with the
 *   400ms ease transform transition, content like ChartTooltipContent.
 * - Cursor: the hover band rectangle (bars) or vertical line (areas).
 *
 * Geometry ports the same algorithms as the Go engine (recharts-scale
 * getNiceTickValues, d3-shape natural spline, preserveEnd tick culling).
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

function niceTicks(max, count) {
  if (count < 2) count = 2;
  for (let correction = 0; ; correction++) {
    const step = adaptiveStep(max / (count - 1), correction);
    if (step <= 0) return [0];
    if (Math.ceil(max / step) + 1 > count) continue;
    return Array.from({ length: count }, (_, i) => step * i);
  }
}

function linearY(v, dmax, top, height) {
  if (dmax === 0) return top + height;
  return top + height - (v / dmax) * height;
}

/* domainOf computes a model's nice y domain (stacked aware). */
function domainOf(m) {
  let max = 0;
  const n = m.series[0].values.length;
  if (m.stacked) {
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (const s of m.series) sum += s.values[i];
      if (sum > max) max = sum;
    }
  } else {
    for (const s of m.series) {
      for (const v of s.values) if (v > max) max = v;
    }
  }
  const ticks = niceTicks(max, 5);
  return ticks[ticks.length - 1];
}

function barGeometry(band, categoryGap) {
  const offset = categoryGap * band;
  let size = band - 2 * offset;
  if (size > 1) size = Math.round(size);
  return [offset, size];
}

function roundedBarPath(x, y, w, h, r) {
  r = Math.min(r, Math.min(w / 2, h / 2));
  if (r <= 0) {
    return `M ${fmtF(x)},${fmtF(y)} h ${fmtF(w)} v ${fmtF(h)} h ${fmtF(-w)} Z`;
  }
  return (
    `M ${fmtF(x)},${fmtF(y + r)} a ${fmtF(r)},${fmtF(r)} 0 0 1 ${fmtF(r)},${fmtF(-r)} ` +
    `h ${fmtF(w - 2 * r)} a ${fmtF(r)},${fmtF(r)} 0 0 1 ${fmtF(r)},${fmtF(r)} ` +
    `v ${fmtF(h - 2 * r)} a ${fmtF(r)},${fmtF(r)} 0 0 1 ${fmtF(-r)},${fmtF(r)} ` +
    `h ${fmtF(-(w - 2 * r))} a ${fmtF(r)},${fmtF(r)} 0 0 1 ${fmtF(-r)},${fmtF(-r)} Z`
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

function areaPathBetween(xs, ysTop, ysBase) {
  const rx = [...xs].reverse();
  const rb = [...ysBase].reverse();
  const base = naturalPath(rx, rb);
  return naturalPath(xs, ysTop) + "L" + base.slice(1) + "Z";
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

function preserveEndTicks(coords, labels, viewEnd, minTickGap, refEl) {
  const start = 0;
  let end = viewEnd;
  const kept = [];
  for (let i = coords.length - 1; i >= 0; i--) {
    const size = measureLabel(labels[i], refEl);
    let tickCoord = coords[i];
    if (i === coords.length - 1) {
      const gap = tickCoord + size / 2 - end;
      if (gap > 0) tickCoord -= gap;
    }
    if (tickCoord < start || tickCoord > end) continue;
    if (tickCoord - size / 2 - start >= 0 && tickCoord + size / 2 - end <= 0) {
      end = tickCoord - (size / 2 + minTickGap);
      kept.push({ index: i, coord: tickCoord });
    }
  }
  return kept.reverse();
}

/* ---------------------------------------------------------------- */
/* Rendering                                                        */
/* ---------------------------------------------------------------- */

let uid = 0;

/* swapSVG applies a newly built SVG to the panel. While the structure is
 * unchanged (animation frames) it only syncs attributes and text in
 * place, like React's reconciliation in Recharts, so frames never churn
 * DOM nodes. */
function swapSVG(panel, svgString) {
  const old = panel.querySelector("svg");
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
 * 400ms, areas reveal left to right and pies sweep over 1500ms. */
function animateChart(panel, m, state, render) {
  if (reducedMotion.matches) {
    render(1);
    return;
  }
  const duration = m.kind === "bar" ? 400 : 1500;
  const start = performance.now();
  let started = false;
  const frame = (now) => {
    started = true;
    const alpha = cssEase(Math.min(1, (now - start) / duration));
    render(alpha);
    if (alpha < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  // Occluded windows freeze rAF entirely, settle on the final frame then.
  // A running animation is never raced, it finishes on its own.
  setTimeout(() => {
    if (!started) render(1);
  }, duration + 200);
}

/* The Recharts update animation: on data changes the chart interpolates
 * every series value from the previous state to the new one (react-smooth
 * prop interpolation), domain included. */
function morphChart(panel, m, state, render, prev) {
  if (reducedMotion.matches) {
    render(1);
    return;
  }
  const duration = m.kind === "bar" ? 400 : 1500;
  const start = performance.now();
  let started = false;
  // When the point count changes the previous curve is resampled onto the
  // new x positions, so the old shape transforms into the new one.
  const resample = (vals, len) => {
    if (vals.length === len) return vals;
    const out = new Array(len);
    for (let i = 0; i < len; i++) {
      const pos = len === 1 ? 0 : (i / (len - 1)) * (vals.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.min(vals.length - 1, lo + 1);
      out[i] = vals[lo] + (vals[hi] - vals[lo]) * (pos - lo);
    }
    return out;
  };
  // Pixel-space interpolation on the final scale: the old values are
  // rescaled into the new domain, so mid-frames never re-quantize the
  // axis and the chart never re-scales at the end.
  const dNew = domainOf(m);
  const dOld = m.kind === "pie" ? 1 : domainOf(prev);
  const scale = m.kind === "pie" ? 1 : dNew / dOld;
  const from = m.series.map((s, si) => resample(prev.series[si].values, s.values.length).map((v) => v * scale));
  const mix = (f) => ({
    ...m,
    domainMax: dNew,
    series: m.series.map((s, si) => ({
      ...s,
      values: s.values.map((v, i) => from[si][i] + (v - from[si][i]) * f),
    })),
  });
  const frame = (now) => {
    started = true;
    const f = cssEase(Math.min(1, (now - start) / duration));
    if (m.kind === "pie") renderPie(panel, mix(f), state, 1);
    else renderCartesian(panel, mix(f), state, 1);
    if (f < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  setTimeout(() => {
    if (!started) render(1);
  }, duration + 200);
}

function renderCartesian(panel, m, state, alpha = 1) {
  const W = panel.clientWidth;
  const H = panel.clientHeight;
  if (!W || !H) return;

  const plotX = m.marginLeft;
  const plotY = m.marginTop;
  const plotW = W - m.marginLeft - m.marginRight;
  const plotH = H - m.marginTop - m.marginBottom - m.xAxisHeight - (m.legendHeight || 0);
  const plotBottom = plotY + plotH;
  const n = m.labels.length;

  // During a morph the scale is pinned to the target domain like
  // Recharts, which interpolates pixel positions on the new scale.
  const domainMax = m.domainMax || domainOf(m);
  const ticks = [0, 1, 2, 3, 4].map((i) => (domainMax * i) / 4);

  // Explicit pixel size like Recharts' Surface: the svg never stretches
  // between resize frames, every frame lays out fresh.
  let svg = `<svg class="recharts-surface" width="${fmtF(W)}" height="${fmtF(H)}" viewBox="0 0 ${fmtF(W)} ${fmtF(H)}">`;

  if (m.gradient) {
    svg += "<defs>";
    for (const s of m.series) {
      svg +=
        `<linearGradient id="${state.uid}-fill-${s.key}" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="5%" stop-color="${s.color}" stop-opacity="0.8"/>` +
        `<stop offset="95%" stop-color="${s.color}" stop-opacity="0.1"/>` +
        `</linearGradient>`;
    }
    svg += "</defs>";
  }

  svg += `<g class="recharts-layer recharts-cartesian-grid"><g class="recharts-cartesian-grid-horizontal">`;
  for (const tv of ticks) {
    const y = linearY(tv, domainMax, plotY, plotH);
    svg += `<line stroke="#ccc" fill="none" x1="${fmtF(plotX)}" y1="${fmtF(y)}" x2="${fmtF(plotX + plotW)}" y2="${fmtF(y)}"/>`;
  }
  svg += "</g></g>";

  let xs = [];
  let band = 0;
  if (m.kind === "bar") {
    const series = m.series[0];
    band = plotW / n;
    const [gapOffset, barW] = barGeometry(band, m.categoryGap);
    svg += `<g class="recharts-layer recharts-bar"><g class="recharts-layer recharts-bar-rectangles">`;
    for (let i = 0; i < n; i++) {
      const x = plotX + i * band + gapOffset;
      const y = linearY(series.values[i] * alpha, domainMax, plotY, plotH);
      svg += `<g class="recharts-layer recharts-bar-rectangle"><path fill="${series.color}" d="${roundedBarPath(x, y, barW, plotBottom - y, m.radius || 0)}"/></g>`;
    }
    svg += "</g></g>";
    for (let i = 0; i < n; i++) xs.push(plotX + i * band + band / 2);
  } else {
    for (let i = 0; i < n; i++) xs.push(plotX + (i * plotW) / (n - 1));
    // Recharts' entrance animation reveals areas left to right through a
    // clipPath rect (AreaRevealShape).
    svg +=
      `<defs><clipPath id="${state.uid}-reveal"><rect x="${fmtF(xs[0] - 1)}" y="0" width="${fmtF((xs[n - 1] - xs[0] + 2) * alpha)}" height="${fmtF(plotBottom + 2)}"/></clipPath></defs>` +
      `<g clip-path="url(#${state.uid}-reveal)">`;
    const baseline = new Array(n).fill(plotBottom);
    let base = baseline;
    state.tops = [];
    for (const s of m.series) {
      const top = m.stacked
        ? base.map((b, i) => b - ((s.values[i] / domainMax) * plotH || 0))
        : s.values.map((v) => linearY(v, domainMax, plotY, plotH));
      const fill = m.gradient ? `url(#${state.uid}-fill-${s.key})` : s.color;
      const fillOpacity = s.fillOpacity || 0.6;
      const areaD = m.stacked ? areaPathBetween(xs, top, base) : areaPathBetween(xs, top, baseline);
      svg +=
        `<g class="recharts-layer recharts-area">` +
        `<path class="recharts-curve recharts-area-area" fill="${fill}" fill-opacity="${fillOpacity}" stroke="none" d="${areaD}"/>` +
        `<path class="recharts-curve recharts-area-curve" stroke="${s.color}" fill="none" stroke-width="1" d="${naturalPath(xs, top)}"/>` +
        `</g>`;
      state.tops.push(top);
      if (m.stacked) base = top;
    }
    svg += "</g>";
  }

  svg += `<g class="recharts-layer recharts-cartesian-axis recharts-xAxis xAxis"><g class="recharts-cartesian-axis-ticks">`;
  for (const tk of preserveEndTicks(xs, m.labels, W, m.minTickGap, panel)) {
    svg +=
      `<g class="recharts-layer recharts-cartesian-axis-tick">` +
      `<text orientation="bottom" height="${fmtF(m.xAxisHeight)}" x="${fmtF(tk.coord)}" y="${fmtF(plotBottom + m.tickMargin)}" stroke="none" fill="#666" class="recharts-text recharts-cartesian-axis-tick-value" text-anchor="middle"><tspan dy="0.71em">${m.labels[tk.index]}</tspan></text>` +
      `</g>`;
  }
  svg += "</g></g></svg>";

  swapSVG(panel, svg);

  state.geom = { W, H, plotX, plotY, plotW, plotH, plotBottom, band, xs, n };
}

/* Pie sector path, the port of the Go SectorPath (degrees, 0 at three
 * o'clock, counterclockwise positive). */
function sectorPath(cx, cy, innerR, outerR, startAngle, endAngle) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const sx0 = cx + outerR * Math.cos(rad(startAngle));
  const sy0 = cy - outerR * Math.sin(rad(startAngle));
  const ex0 = cx + outerR * Math.cos(rad(endAngle));
  const ey0 = cy - outerR * Math.sin(rad(endAngle));
  const sx1 = cx + innerR * Math.cos(rad(endAngle));
  const sy1 = cy - innerR * Math.sin(rad(endAngle));
  const ex1 = cx + innerR * Math.cos(rad(startAngle));
  const ey1 = cy - innerR * Math.sin(rad(startAngle));
  const large = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const sweep = endAngle > startAngle ? 0 : 1;
  return (
    `M ${fmtF(sx0)},${fmtF(sy0)} A ${fmtF(outerR)},${fmtF(outerR)},0,${large},${sweep},${fmtF(ex0)},${fmtF(ey0)} ` +
    `L ${fmtF(sx1)},${fmtF(sy1)} A ${fmtF(innerR)},${fmtF(innerR)},0,${large},${1 - sweep},${fmtF(ex1)},${fmtF(ey1)} Z`
  );
}

/* renderPie is the client pendant of the Go pieSVG: sectors from the
 * model, the active ring and the center label. The alpha sweep is the
 * Recharts pie entrance animation. */
function renderPie(panel, m, state, alpha = 1) {
  const W = panel.clientWidth;
  const H = panel.clientHeight;
  if (!W || !H) return;
  const margin = 5;
  const cx = W / 2;
  const cy = H / 2;
  const maxR = (Math.min(W, H) - 2 * margin) / 2;
  const outerR = maxR * 0.8;
  const values = m.series[0].values;
  const total = values.reduce((a, b) => a + b, 0);
  const strokeWidth = m.strokeWidth ? ` stroke-width="${fmtF(m.strokeWidth)}"` : "";

  let svg = `<svg class="recharts-surface" width="${fmtF(W)}" height="${fmtF(H)}" viewBox="0 0 ${fmtF(W)} ${fmtF(H)}">`;
  svg += `<g class="recharts-layer recharts-pie">`;
  let angle = 0;
  const visible = alpha * 360;
  for (let i = 0; i < values.length; i++) {
    const sweep = (values[i] / total) * 360;
    const shown = Math.max(0, Math.min(sweep, visible - angle));
    if (shown <= 0) break;
    const fill = m.sliceColors[i];
    if (i === m.activeIndex && m.activeRing) {
      svg +=
        `<g class="recharts-layer recharts-pie-sector">` +
        `<path class="recharts-sector" stroke="#fff"${strokeWidth} fill="${fill}" data-tui-chart-sector="${i}" d="${sectorPath(cx, cy, m.innerRadius, outerR + 10, angle, angle + shown)}"/>` +
        `<path class="recharts-sector" stroke="#fff"${strokeWidth} fill="${fill}" data-tui-chart-sector="${i}" d="${sectorPath(cx, cy, outerR + 12, outerR + 25, angle, angle + shown)}"/>` +
        `</g>`;
    } else {
      svg += `<g class="recharts-layer recharts-pie-sector"><path class="recharts-sector" stroke="#fff"${strokeWidth} fill="${fill}" data-tui-chart-sector="${i}" d="${sectorPath(cx, cy, m.innerRadius, outerR, angle, angle + shown)}"/></g>`;
    }
    angle += sweep;
  }
  if (m.centerValue) {
    svg +=
      `<text x="${fmtF(cx)}" y="${fmtF(cy)}" text-anchor="middle" dominant-baseline="middle">` +
      `<tspan x="${fmtF(cx)}" y="${fmtF(cy)}" class="fill-foreground text-3xl font-bold">${m.centerValue}</tspan>` +
      `<tspan x="${fmtF(cx)}" y="${fmtF(cy + 24)}" class="fill-muted-foreground">${m.centerLabel}</tspan>` +
      `</text>`;
  }
  svg += "</g></svg>";

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

function tooltipHTML(m, i) {
  const t = m.tooltip || {};
  const label = (m.tooltipLabels && m.tooltipLabels[i]) || m.labels[i];
  // Like ChartTooltipContent: a single non-dot series nests the label
  // inside the row, so the line indicator spans the full row height.
  const nestLabel = m.kind !== "pie" && m.series.length === 1 && t.indicator && t.indicator !== "dot";
  let html = `<div class="${TOOLTIP_CLASS}${t.width ? " " + t.width : ""}">`;
  if (!t.hideLabel && !nestLabel) {
    html += `<div class="font-medium">${label}</div>`;
  }
  html += `<div class="grid gap-1.5">`;
  if (m.kind === "pie") {
    const s = m.series[0];
    const color = (m.sliceColors && m.sliceColors[i]) || s.color;
    html +=
      `<div class="flex w-full flex-wrap items-stretch gap-2 items-center [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground">` +
      indicatorHTML(t.indicator, color) +
      `<div class="flex flex-1 justify-between leading-none items-center">` +
      `<div class="grid gap-1.5"><span class="text-muted-foreground">${m.labels[i]}</span></div>` +
      `<span class="font-mono font-medium text-foreground tabular-nums">${s.values[i].toLocaleString("en-US")}</span>` +
      `</div></div></div></div>`;
    return html;
  }
  for (const s of m.series) {
    const rowCls =
      "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground" +
      (t.indicator !== "line" && t.indicator !== "dashed" ? " items-center" : "");
    const nested = nestLabel && !t.hideLabel ? `<div class="font-medium">${label}</div>` : "";
    html +=
      `<div class="${rowCls}">` +
      indicatorHTML(t.indicator, s.color) +
      `<div class="flex flex-1 justify-between leading-none ${nestLabel ? "items-end" : "items-center"}">` +
      `<div class="grid gap-1.5">${nested}<span class="text-muted-foreground">${s.label}</span></div>` +
      `<span class="font-mono font-medium text-foreground tabular-nums">${s.values[i].toLocaleString("en-US")}</span>` +
      `</div></div>`;
  }
  html += "</div></div>";
  return html;
}

function showCursor(panel, m, state, i) {
  const svg = panel.querySelector("svg");
  if (!svg || m.cursor === false) return;
  let cursor = svg.querySelector(".recharts-tooltip-cursor");
  const g = state.geom;
  // Recharts draws the cursor between the grid and the series, so bars
  // and areas render on top of the hover band.
  const seriesLayer = svg.querySelector(".recharts-bar, .recharts-area");
  if (m.kind === "bar") {
    const x = g.plotX + i * g.band;
    const d = `M ${fmtF(x)},${fmtF(g.plotY)} h ${fmtF(g.band)} v ${fmtF(g.plotH)} h ${fmtF(-g.band)} Z`;
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
  const svg = panel.querySelector("svg");
  if (!svg || m.kind !== "area" || !state.tops) return;
  let layer = svg.querySelector(".recharts-active-dots");
  if (!layer) {
    svg.insertAdjacentHTML("beforeend", `<g class="recharts-layer recharts-active-dots"></g>`);
    layer = svg.querySelector(".recharts-active-dots");
  }
  let html = "";
  for (let s = 0; s < m.series.length; s++) {
    html += `<circle class="recharts-dot" r="4" stroke="#fff" stroke-width="2" fill="${m.series[s].color}" cx="${fmtF(state.geom.xs[i])}" cy="${fmtF(state.tops[s][i])}"/>`;
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

function initPanel(script) {
  if (script.dataset.tuiChartInit) return;
  script.dataset.tuiChartInit = "true";

  const panel = script.parentElement;
  const container = panel.closest("[data-tui-chart]");
  const m = JSON.parse(script.textContent);
  const state = { uid: "tui-chart-" + uid++ };

  const render = (alpha = 1) => {
    if (m.kind === "pie") renderPie(panel, m, state, alpha);
    else renderCartesian(panel, m, state, alpha);
  };

  // On mount the entrance animation plays. When a hidden panel becomes
  // visible (range/series/month switches) Recharts morphs from the old
  // to the new values instead, so we interpolate from the previously
  // visible panel's model when the shapes line up. Plain resizes
  // re-render without animating.
  const enter = () => {
    const prev = container._tuiActive;
    container._tuiActive = m;
    if (prev && prev !== m && prev.kind === m.kind && prev.series.length === m.series.length) {
      morphChart(panel, m, state, render, prev);
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
    if (chartX < g.plotX || chartX > g.plotX + g.plotW) return -1;
    if (chartY < g.plotY || chartY > g.plotBottom) return -1;
    if (m.kind === "bar") {
      return Math.max(0, Math.min(g.n - 1, Math.floor((chartX - g.plotX) / g.band)));
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
      positionTooltip(e, null, idx);
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
    positionTooltip(e, state.geom ? state.geom.xs[i] : chartX, i);
  });

  function positionTooltip(e, snapX, i) {
    const wasHidden = wrapper.style.visibility !== "visible";
    wrapper.innerHTML = tooltipHTML(m, i);
    wrapper.style.visibility = "visible";
    const crect = container.getBoundingClientRect();
    const tw = wrapper.offsetWidth;
    const th = wrapper.offsetHeight;
    const px = snapX != null ? snapX + (panel.getBoundingClientRect().left - crect.left) : e.clientX - crect.left;
    const py = e.clientY - crect.top;
    let tx = px + OFFSET;
    if (tx + tw > crect.width) tx = px - tw - OFFSET;
    let ty = py + OFFSET;
    if (ty + th > crect.height) ty = py - th - OFFSET;
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

function init(root = document) {
  root.querySelectorAll("script[data-tui-chart-model]").forEach(initPanel);
}

init();
document.addEventListener("DOMContentLoaded", () => init());
document.body.addEventListener("htmx:afterSwap", (e) => init(e.target));
if (window.Datastar) {
  document.addEventListener("datastar-fetch", () => setTimeout(() => init(), 0));
}

const observer = new MutationObserver((mutations) => {
  for (const mu of mutations) {
    if (mu.type === "childList") {
      for (const node of mu.addedNodes) {
        if (node.nodeType === 1) init(node);
      }
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
