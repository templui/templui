(function () {
  "use strict";

  const THEMES = {
    light:
      "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css",
    dark: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css",
  };

  function update() {
    const isDark = document.documentElement.classList.contains("dark");
    document.querySelectorAll("#highlight-theme").forEach((link) => {
      link.href = isDark ? THEMES.dark : THEMES.light;
    });
  }

  function highlight() {
    if (!window.hljs) return;
    document
      .querySelectorAll("[data-tui-code-block]:not(.hljs)")
      .forEach((block) => window.hljs.highlightElement(block));
  }

  function init() {
    update();
    highlight();
  }

  function waitForHljs(callback) {
    if (window.hljs) {
      callback();
    } else {
      requestAnimationFrame(() => waitForHljs(callback));
    }
  }

  waitForHljs(init);

  new MutationObserver(init).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
    subtree: true,
  });
})();
