// Runs inside the /create preview iframe: receives design-system-params via
// postMessage and turns them into CSS variables (a generated style block, so
// light and dark values both apply). Forwards the dark-mode shortcut.
(function () {
  "use strict";

  const RADII = { default: "", none: "0", small: "0.45rem", medium: "0.625rem", large: "0.875rem" };

  function theme(name) {
    return (window.tuiCreateThemes || []).find((t) => t.name === name);
  }

  function block(vars) {
    return Object.entries(vars || {})
      .filter(([key]) => key !== "radius")
      .map(([key, value]) => "  --" + key + ": " + value + ";")
      .join("\n");
  }

  function pick(vars, keys) {
    const out = {};
    for (const key of keys) {
      if (vars && vars[key] != null) out[key] = vars[key];
    }
    return out;
  }

  const CHART_KEYS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

  function apply(params) {
    const base = theme(params.baseColor) || theme("neutral");
    const accent = theme(params.theme);
    const chart = theme(params.chartColor);

    let light = Object.assign({}, base?.cssVars?.light);
    let dark = Object.assign({}, base?.cssVars?.dark);
    if (accent && accent !== base) {
      Object.assign(light, accent.cssVars?.light);
      Object.assign(dark, accent.cssVars?.dark);
    }
    if (chart) {
      Object.assign(light, pick(chart.cssVars?.light, CHART_KEYS));
      Object.assign(dark, pick(chart.cssVars?.dark, CHART_KEYS));
    }

    const radius = RADII[params.radius];
    const fontSans = params.font === "mono" ? "var(--font-mono)" : "";

    let css = ":root {\n" + block(light) + "\n";
    if (radius) css += "  --radius: " + radius + ";\n";
    if (fontSans) css += "  --font-sans: " + fontSans + ";\n";
    css += "}\n.dark {\n" + block(dark) + "\n}\n";

    let style = document.getElementById("tui-create-vars");
    if (!style) {
      style = document.createElement("style");
      style.id = "tui-create-vars";
      document.head.appendChild(style);
    }
    style.textContent = css;

    document.documentElement.classList.toggle("dark", !!params.dark);
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "design-system-params" && data.params) {
      apply(data.params);
    }
  });

  // Tell the parent we are ready for the initial params.
  window.parent?.postMessage({ type: "tui-create-ready" }, window.location.origin);
})();
