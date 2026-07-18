(function () {
  "use strict";

  const CLOSE_DURATION_MS = 120;

  // Resolves a <dialog data-tui-dialog-content> from an id, the element
  // itself, or anything inside it.
  function getDialog(target) {
    if (!target) return null;
    if (typeof target === "string") {
      const el = document.getElementById(target);
      return el && el.matches("dialog[data-tui-dialog-content]") ? ensureDialog(el) : null;
    }
    if (target.matches?.("dialog[data-tui-dialog-content]")) return ensureDialog(target);
    return ensureDialog(target.closest?.("dialog[data-tui-dialog-content]") || null);
  }

  function dialogFor(element) {
    const id =
      element.getAttribute("aria-controls") || element.getAttribute("data-tui-dialog-target");
    if (id) return getDialog(id);
    return getDialog(element);
  }

  function triggersFor(dialog) {
    if (!dialog.id) return [];
    return document.querySelectorAll(
      '[data-tui-dialog-trigger][aria-controls="' + dialog.id + '"]',
    );
  }

  function ensureDialog(dialog) {
    if (!dialog || dialog.dataset.tuiDialogInitialized === "true") return dialog;
    dialog.dataset.tuiDialogInitialized = "true";

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      if (dialog.hasAttribute("data-tui-dialog-disable-esc")) return;
      closeDialog(dialog);
    });

    dialog.addEventListener("close", () => {
      window.clearTimeout(dialog._tuiCloseTimer);
      delete dialog._tuiCloseTimer;
      dialog.removeAttribute("data-tui-dialog-closing");
      updateState(dialog, false);
    });

    // A click on the backdrop targets the dialog element itself.
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      if (dialog.hasAttribute("data-tui-dialog-disable-click-away")) return;
      closeDialog(dialog);
    });

    return dialog;
  }

  function updateState(dialog, isOpen) {
    dialog.setAttribute("data-tui-dialog-open", isOpen ? "true" : "false");
    triggersFor(dialog).forEach((trigger) => {
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  function openDialog(target) {
    const dialog = getDialog(target);
    if (!dialog) return;

    window.clearTimeout(dialog._tuiCloseTimer);
    delete dialog._tuiCloseTimer;
    dialog.removeAttribute("data-tui-dialog-closing");

    if (!dialog.open) {
      try {
        if (dialog.getAttribute("data-tui-dialog-show-modal") === "true") {
          dialog.showModal();
        } else {
          dialog.show();
        }
      } catch {
        return;
      }
    }

    // Safari needs the closed start position rendered before the open state
    // lands, otherwise the enter animation is skipped.
    void dialog.offsetWidth;

    updateState(dialog, true);
  }

  function closeDialog(target) {
    const dialog = getDialog(target);
    if (!dialog) return;

    if (!dialog.open) {
      updateState(dialog, false);
      return;
    }
    if (dialog.dataset.tuiDialogClosing === "true") return;

    dialog.setAttribute("data-tui-dialog-closing", "true");
    updateState(dialog, false);

    dialog._tuiCloseTimer = window.setTimeout(() => {
      if (dialog.open) {
        dialog.close();
      } else {
        dialog.removeAttribute("data-tui-dialog-closing");
      }
    }, CLOSE_DURATION_MS);
  }

  function isDialogOpen(target) {
    return getDialog(target)?.open || false;
  }

  function toggleDialog(target) {
    isDialogOpen(target) ? closeDialog(target) : openDialog(target);
  }

  function initDialogs(root = document) {
    root.querySelectorAll("dialog[data-tui-dialog-content]").forEach((dialog) => {
      if (dialog.dataset.tuiDialogInitialized === "true") return;
      ensureDialog(dialog);

      if (dialog.getAttribute("data-tui-dialog-initial-open") === "true") {
        // One-shot: consume the attribute so a later re-init never re-opens
        // a closed dialog.
        dialog.removeAttribute("data-tui-dialog-initial-open");
        openDialog(dialog);
      } else {
        updateState(dialog, dialog.open);
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest("[data-tui-dialog-trigger]");
    if (trigger) {
      toggleDialog(dialogFor(trigger));
      return;
    }
    const closeButton = event.target.closest("[data-tui-dialog-close]");
    if (closeButton) {
      closeDialog(dialogFor(closeButton));
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initDialogs());
  } else {
    initDialogs();
  }

  // Initialize dialogs added later (e.g. swapped in via htmx), so a
  // server-rendered dialog with Open true still gets showModal().
  new MutationObserver(() => initDialogs()).observe(document.body, {
    childList: true,
    subtree: true,
  });

  window.tui = window.tui || {};
  window.tui.dialog = {
    open: openDialog,
    close: closeDialog,
    toggle: toggleDialog,
    isOpen: isDialogOpen,
  };
})();
