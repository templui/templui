(function () {
  // IIFE
  function initTextarea(textarea) {
    if (textarea.hasAttribute("data-initialized")) return;

    textarea.setAttribute("data-initialized", "true");

    const autoResize = textarea.dataset.autoResize === "true";
    if (!autoResize) return;

    const computedStyle = window.getComputedStyle(textarea);
    const initialMinHeight = computedStyle.minHeight;

    function resize() {
      textarea.style.height = initialMinHeight;
      textarea.style.height = `${textarea.scrollHeight}px`;
    }

    resize();
    textarea.addEventListener("input", resize);
  }

  function initAllComponents(root = document) {
    if (root instanceof Element && root.matches("textarea[data-textarea]")) {
      initTextarea(root);
    }
    for (const textarea of root.querySelectorAll(
      "textarea[data-textarea]:not([data-initialized])"
    )) {
      initTextarea(textarea);
    }
  }

  const handleHtmxSwap = (event) => {
    const target = event.detail.elt;
    if (target instanceof Element) {
      requestAnimationFrame(() => initAllComponents(target));
    }
  };

  document.addEventListener("DOMContentLoaded", () => initAllComponents());
  document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);
})(); // End of IIFE
