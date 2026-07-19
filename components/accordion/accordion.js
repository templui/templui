(function () {
  "use strict";

  // Matches the tw-animate accordion animation duration (0.2s ease-out).
  const DURATION_MS = 200;

  function contentOf(item) {
    return item.querySelector("[data-tui-accordion-content]");
  }

  function setOpen(el, isOpen) {
    el.toggleAttribute("data-open", isOpen);
    el.toggleAttribute("data-closed", !isOpen);
  }

  function openItem(item) {
    const content = contentOf(item);
    item.open = true;
    if (!content) return;
    content.style.setProperty("--tui-accordion-panel-height", content.scrollHeight + "px");
    setOpen(content, true);
  }

  function closeItem(item) {
    const content = contentOf(item);
    if (!content) {
      item.open = false;
      return;
    }
    content.style.setProperty("--tui-accordion-panel-height", content.scrollHeight + "px");
    setOpen(content, false);
    clearTimeout(item._tuiClose);
    item._tuiClose = setTimeout(() => {
      if (!content.hasAttribute("data-open")) item.open = false;
    }, DURATION_MS);
  }

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const summary = e.target.closest("[data-tui-accordion-item] > summary");
    if (!summary) return;
    e.preventDefault();

    const item = summary.parentElement;
    clearTimeout(item._tuiClose);

    const content = contentOf(item);
    const isOpen = item.open && (!content || content.hasAttribute("data-open"));
    if (isOpen) {
      closeItem(item);
      return;
    }

    // One open item per accordion, closed with its exit animation (the
    // native details name grouping would snap the sibling shut instantly).
    const accordion = item.closest('[data-slot="accordion"]');
    if (accordion) {
      accordion.querySelectorAll("[data-tui-accordion-item][open]").forEach((other) => {
        if (other !== item) closeItem(other);
      });
    }
    openItem(item);
  });
})();
