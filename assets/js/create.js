// /create page controller: design system params live in the ?preset= URL
// param (encoded), pickers write them, the preview iframe receives them via
// postMessage. Browser history is the undo stack.
(function () {
  "use strict";

  const BASE_COLORS = ["neutral", "stone", "zinc", "mauve", "olive", "mist", "taupe"];
  const RADII = [
    { name: "default", label: "Default" },
    { name: "none", label: "None" },
    { name: "small", label: "Small" },
    { name: "medium", label: "Medium" },
    { name: "large", label: "Large" },
  ];
  const FONTS = [
    { name: "geist", label: "Geist" },
    { name: "mono", label: "Geist Mono" },
  ];
  const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  const DEFAULTS = {
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    font: "geist",
    radius: "default",
  };

  let params = Object.assign({}, DEFAULTS);
  let item = "preview-02";
  let dark = document.documentElement.classList.contains("dark");
  let override = null; // hover preview, never committed

  function themes() {
    return window.tuiCreateThemes || [];
  }

  function themeNames() {
    return themes().map((t) => t.name);
  }

  // Themes offered for the current base color: the base itself + accents.
  function themesForBase(baseColor) {
    return themeNames().filter((n) => n === baseColor || !BASE_COLORS.includes(n));
  }

  function titleOf(name) {
    const t = themes().find((x) => x.name === name);
    return t ? t.title : name;
  }

  // ----- preset code ----------------------------------------------------------

  const FIELDS = [
    { key: "baseColor", values: () => BASE_COLORS },
    { key: "theme", values: () => themeNames() },
    { key: "chartColor", values: () => themeNames() },
    { key: "font", values: () => FONTS.map((f) => f.name) },
    { key: "radius", values: () => RADII.map((r) => r.name) },
  ];

  function encodePreset(p) {
    let code = "t1";
    for (const field of FIELDS) {
      const index = Math.max(0, field.values().indexOf(p[field.key]));
      code += ALPHABET[index] || "0";
    }
    return code;
  }

  function decodePreset(code) {
    const out = Object.assign({}, DEFAULTS);
    if (!code || !code.startsWith("t1")) return out;
    const chars = code.slice(2);
    FIELDS.forEach((field, i) => {
      const index = ALPHABET.indexOf(chars[i] ?? "0");
      const value = field.values()[index];
      if (value) out[field.key] = value;
    });
    return out;
  }

  function isDefault(p) {
    return FIELDS.every((f) => p[f.key] === DEFAULTS[f.key]);
  }

  // ----- url + history --------------------------------------------------------

  function readURL() {
    const url = new URL(window.location.href);
    params = decodePreset(url.searchParams.get("preset"));
    item = url.searchParams.get("item") || "preview-02";
  }

  function writeURL(push) {
    const url = new URL(window.location.href);
    if (isDefault(params)) {
      url.searchParams.delete("preset");
    } else {
      url.searchParams.set("preset", encodePreset(params));
    }
    if (item === "preview-02") {
      url.searchParams.delete("item");
    } else {
      url.searchParams.set("item", item);
    }
    if (push) {
      history.pushState(null, "", url);
    } else {
      history.replaceState(null, "", url);
    }
  }

  // ----- preview sync ---------------------------------------------------------

  function iframe() {
    return document.querySelector("[data-tui-create-preview]");
  }

  function sendParams() {
    const frame = iframe();
    if (!frame?.contentWindow) return;
    const merged = override ? Object.assign({}, params, override) : params;
    frame.contentWindow.postMessage(
      { type: "design-system-params", params: Object.assign({ dark: dark }, merged) },
      window.location.origin,
    );
  }

  function setItem(next) {
    if (item === next) return;
    item = next;
    writeURL(true);
    const frame = iframe();
    if (frame) frame.src = "/create/preview?item=" + encodeURIComponent(item);
    render();
  }

  // ----- rendering ------------------------------------------------------------

  function swatchColor(name) {
    const t = themes().find((x) => x.name === name);
    return t?.cssVars?.dark?.["primary"] || t?.cssVars?.dark?.["muted-foreground"] || "";
  }

  function render() {
    const labels = {
      baseColor: titleOf(params.baseColor),
      theme: titleOf(params.theme),
      chartColor: titleOf(params.chartColor),
      font: FONTS.find((f) => f.name === params.font)?.label,
      radius: RADII.find((r) => r.name === params.radius)?.label,
    };
    for (const [key, value] of Object.entries(labels)) {
      const el = document.querySelector('[data-tui-create-value="' + key + '"]');
      if (el && value) el.textContent = value;
    }
    for (const key of ["baseColor", "theme", "chartColor"]) {
      const swatch = document.querySelector('[data-tui-create-swatch="' + key + '"]');
      if (swatch) swatch.style.setProperty("--color", swatchColor(params[key]));
    }
    document.querySelectorAll("[data-tui-create-item]").forEach((button) => {
      button.setAttribute(
        "data-active",
        button.getAttribute("data-tui-create-item") === item ? "true" : "false",
      );
    });
    const css = document.querySelector("[data-tui-create-css]");
    if (css) css.value = generateCSS();
  }

  function set(key, value, push) {
    if (params[key] === value) return;
    params = Object.assign({}, params, { [key]: value });
    // Switching the base color re-homes a base-colored theme/chart selection.
    if (key === "baseColor") {
      if (BASE_COLORS.includes(params.theme)) params.theme = value;
      if (BASE_COLORS.includes(params.chartColor)) params.chartColor = value;
    }
    writeURL(push !== false);
    override = null;
    sendParams();
    render();
  }

  // ----- picker popup ---------------------------------------------------------

  let openPicker = null; // param name of the open picker

  function popup() {
    return document.querySelector("[data-tui-create-popup]");
  }

  function optionsFor(param) {
    switch (param) {
      case "baseColor":
        return BASE_COLORS.map((n) => ({ value: n, label: titleOf(n) }));
      case "theme":
        return themesForBase(params.baseColor).map((n) => ({ value: n, label: titleOf(n) }));
      case "chartColor":
        return themesForBase(params.baseColor).map((n) => ({ value: n, label: titleOf(n) }));
      case "font":
        return FONTS.map((f) => ({ value: f.name, label: f.label }));
      case "radius":
        return RADII.map((r) => ({ value: r.name, label: r.label }));
      default:
        return [];
    }
  }

  const ITEM_CLASS =
    "relative flex w-full cursor-default items-center gap-2 rounded-lg py-1.5 pr-8 pl-2 text-left text-sm font-medium outline-hidden select-none text-neutral-100 focus:bg-neutral-600 hover:bg-neutral-600";
  const CHECK_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M20 6 9 17l-5-5"/></svg>';

  function openPickerFor(trigger) {
    const param = trigger.getAttribute("data-tui-create-picker");
    const pop = popup();
    if (!pop) return;

    pop.innerHTML = "";
    for (const option of optionsFor(param)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = ITEM_CLASS;
      button.setAttribute("data-value", option.value);
      button.textContent = option.label;
      if (option.value === params[param]) {
        const check = document.createElement("span");
        check.className = "pointer-events-none absolute right-2 flex items-center justify-center";
        check.innerHTML = CHECK_SVG;
        button.appendChild(check);
      }
      button.addEventListener("click", () => {
        set(param, option.value);
        closePicker();
      });
      // Hover previews overlay the committed params without touching the URL.
      button.addEventListener("mouseenter", () => {
        override = { [param]: option.value };
        sendParams();
      });
      pop.appendChild(button);
    }
    pop.addEventListener("mouseleave", clearOverride);

    pop.hidden = false;
    const rect = trigger.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    let top = rect.top;
    let left = rect.right + 20;
    if (left + popRect.width > window.innerWidth - 8) {
      left = Math.max(8, rect.left - popRect.width - 20);
    }
    top = Math.min(top, window.innerHeight - popRect.height - 8);
    pop.style.top = Math.max(8, top) + "px";
    pop.style.left = left + "px";

    openPicker = param;
    trigger.setAttribute("data-open", "true");
  }

  function clearOverride() {
    if (!override) return;
    override = null;
    sendParams();
  }

  function closePicker() {
    const pop = popup();
    if (pop) pop.hidden = true;
    document
      .querySelectorAll("[data-tui-create-picker][data-open], [data-tui-create-menu][data-open]")
      .forEach((t) => t.removeAttribute("data-open"));
    openPicker = null;
    clearOverride();
  }

  // ----- css export -----------------------------------------------------------

  function generateCSS() {
    const list = themes();
    const base = list.find((t) => t.name === params.baseColor);
    const accent = list.find((t) => t.name === params.theme);
    const chart = list.find((t) => t.name === params.chartColor);
    const radii = { default: "", none: "0", small: "0.45rem", medium: "0.625rem", large: "0.875rem" };

    const light = Object.assign({}, base?.cssVars?.light);
    const darkVars = Object.assign({}, base?.cssVars?.dark);
    if (accent && accent !== base) {
      Object.assign(light, accent.cssVars?.light);
      Object.assign(darkVars, accent.cssVars?.dark);
    }
    if (chart) {
      for (const key of ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]) {
        if (chart.cssVars?.light?.[key]) light[key] = chart.cssVars.light[key];
        if (chart.cssVars?.dark?.[key]) darkVars[key] = chart.cssVars.dark[key];
      }
    }
    if (radii[params.radius]) light["radius"] = radii[params.radius];

    const printBlock = (selector, vars) =>
      selector +
      " {\n" +
      Object.entries(vars)
        .map(([k, v]) => "  --" + k + ": " + v + ";")
        .join("\n") +
      "\n}\n";

    let css = printBlock(":root", light) + "\n" + printBlock(".dark", darkVars);
    if (params.font === "mono") {
      css += "\n:root {\n  --font-sans: var(--font-mono);\n}\n";
    }
    return css;
  }

  // ----- actions --------------------------------------------------------------

  function randomOf(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function toggleDark() {
    document.documentElement.classList.toggle("dark");
  }

  function openPresetPrompt() {
    const input = window.prompt("Paste a preset code or URL");
    if (!input) return;
    let code = input.trim();
    try {
      const url = new URL(code);
      code = url.searchParams.get("preset") || code;
    } catch {}
    params = decodePreset(code);
    writeURL(true);
    sendParams();
    render();
  }

  // ----- main menu -------------------------------------------------------------

  const MENU_ACTIONS = [
    { label: "Open Preset...", shortcut: "O", action: openPresetPrompt },
    { label: "Shuffle", shortcut: "R", action: randomize },
    { label: "Light/Dark", shortcut: "D", action: toggleDark },
    { separator: true },
    { label: "Undo", shortcut: "⌘Z", action: () => history.back() },
    { label: "Redo", shortcut: "⇧⌘Z", action: () => history.forward() },
    { separator: true },
    { label: "Reset", shortcut: "⇧R", action: reset },
  ];

  function openMainMenu(trigger) {
    const pop = popup();
    if (!pop) return;
    pop.innerHTML = "";
    for (const entry of MENU_ACTIONS) {
      if (entry.separator) {
        const sep = document.createElement("div");
        sep.className = "-mx-1.5 my-1.5 h-px bg-neutral-600";
        pop.appendChild(sep);
        continue;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = ITEM_CLASS;
      button.textContent = entry.label;
      const shortcut = document.createElement("span");
      shortcut.className = "ml-auto text-xs tracking-widest text-neutral-400";
      shortcut.textContent = entry.shortcut;
      button.appendChild(shortcut);
      button.addEventListener("click", () => {
        closePicker();
        entry.action();
      });
      pop.appendChild(button);
    }

    pop.hidden = false;
    const rect = trigger.getBoundingClientRect();
    pop.style.top = rect.top + "px";
    pop.style.left = rect.right + 20 + "px";
    openPicker = "mainmenu";
    trigger.setAttribute("data-open", "true");
  }

  function randomize() {
    const baseColor = randomOf(BASE_COLORS);
    const accents = themesForBase(baseColor);
    params = {
      baseColor: baseColor,
      theme: randomOf(accents),
      chartColor: randomOf(accents),
      font: randomOf(FONTS).name,
      radius: randomOf(RADII).name,
    };
    writeURL(true);
    sendParams();
    render();
  }

  function reset() {
    params = Object.assign({}, DEFAULTS);
    writeURL(true);
    sendParams();
    render();
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const label = button.textContent;
      button.textContent = "Copied!";
      setTimeout(() => (button.textContent = label), 1500);
    } catch {}
  }

  // ----- wiring ---------------------------------------------------------------

  function init() {
    const root = document.querySelector("[data-tui-create]");
    if (!root) return;

    readURL();
    const frame = iframe();
    if (frame && item !== "preview-01") {
      frame.src = "/create/preview?item=" + encodeURIComponent(item);
    }
    render();

    document.addEventListener("pointerdown", (e) => {
      if (!(e.target instanceof Element)) return;
      if (e.target.closest("[data-tui-create-popup]")) return;
      const menuTrigger = e.target.closest("[data-tui-create-menu]");
      if (menuTrigger) {
        if (openPicker === "mainmenu") {
          closePicker();
        } else {
          closePicker();
          openMainMenu(menuTrigger);
        }
        return;
      }
      const trigger = e.target.closest("[data-tui-create-picker]");
      if (trigger) {
        const param = trigger.getAttribute("data-tui-create-picker");
        if (openPicker === param) {
          closePicker();
        } else {
          closePicker();
          openPickerFor(trigger);
        }
        return;
      }
      closePicker();
    });

    document.addEventListener("click", (e) => {
      if (!(e.target instanceof Element)) return;
      const item01 = e.target.closest("[data-tui-create-item]");
      if (item01) {
        setItem(item01.getAttribute("data-tui-create-item"));
        return;
      }
      if (e.target.closest("[data-tui-create-random]")) {
        randomize();
        return;
      }
      if (e.target.closest("[data-tui-create-reset]")) {
        reset();
        return;
      }
      const copy = e.target.closest("[data-tui-create-copy]");
      if (copy) {
        copyText(window.location.href, copy);
        return;
      }
      const copyCSS = e.target.closest("[data-tui-create-copy-css]");
      if (copyCSS) {
        copyText(generateCSS(), copyCSS);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closePicker();
        return;
      }
      // Undo/redo ride the browser history, like shadcn.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          history.forward();
        } else {
          history.back();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable]")) {
        return;
      }
      if (e.key === "o") openPresetPrompt();
      if (e.key === "r") randomize();
      if (e.key === "d") toggleDark();
      if (e.key === "R" && e.shiftKey) reset();
    });

    // The preview follows the site theme (the navbar theme switcher), like
    // shadcn: watch the html class instead of owning a separate toggle.
    new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark !== dark) {
        dark = isDark;
        sendParams();
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Back/forward = undo/redo.
    window.addEventListener("popstate", () => {
      readURL();
      sendParams();
      render();
    });

    window.addEventListener("message", (e) => {
      if (e.origin !== window.location.origin || !e.data || typeof e.data !== "object") return;
      if (e.data.type === "tui-create-ready") sendParams();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
