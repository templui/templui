(function () {
  "use strict";

  const CLOSE_DURATION_MS = 200;

  function getRoot(target) {
    if (!target) return null;

    if (typeof target === "string") {
      const byId = document.getElementById(target);
      if (byId?.matches?.("[data-tui-dialog]")) {
        return byId;
      }

      try {
        return document.querySelector(target)?.closest("[data-tui-dialog]") || null;
      } catch {
        return null;
      }
    }

    if (target.matches?.("[data-tui-dialog]")) {
      return target;
    }

    return target.closest?.("[data-tui-dialog]") || null;
  }

  function getDialog(root) {
    if (!root) return null;
    return ensureDialog(root.querySelector("[data-tui-dialog-content]"));
  }

  function getOwnedTriggers(root) {
    if (!root) return [];

    return Array.from(root.querySelectorAll("[data-tui-dialog-trigger]")).filter(
      (trigger) => !trigger.hasAttribute("data-tui-dialog-target"),
    );
  }

  function getTargetedTriggers(targetId) {
    if (!targetId) return [];

    return Array.from(
      document.querySelectorAll(
        `[data-tui-dialog-trigger][data-tui-dialog-target="${targetId}"]`,
      ),
    );
  }

  function getTargetValue(element) {
    const target = element?.getAttribute("data-tui-dialog-target");
    return target && target.trim() ? target.trim() : null;
  }

  function getRootForElement(element) {
    return getRoot(getTargetValue(element) || element);
  }

  function ensureDialog(dialog) {
    if (!dialog || dialog.dataset.tuiDialogInitialized === "true") return dialog;

    dialog.dataset.tuiDialogInitialized = "true";

    dialog.addEventListener("cancel", (event) => {
      const root = getRoot(dialog);
      if (root?.hasAttribute("data-tui-dialog-disable-esc")) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      closeDialog(root);
    });

    dialog.addEventListener("close", () => {
      const root = getRoot(dialog);
      window.clearTimeout(dialog._tuiDialogCloseTimer);
      delete dialog._tuiDialogCloseTimer;
      dialog.removeAttribute("data-tui-dialog-closing");
      root?.removeAttribute("data-tui-dialog-closing");
      updateState(getRoot(dialog), false);
    });

    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;

      const root = getRoot(dialog);
      if (root?.hasAttribute("data-tui-dialog-disable-click-away")) {
        return;
      }

      closeDialog(root);
    });

    return dialog;
  }

  function updateState(root, isOpen) {
    const dialog = getDialog(root);
    dialog?.setAttribute("data-tui-dialog-open", isOpen ? "true" : "false");
    root?.setAttribute("data-tui-dialog-open", isOpen ? "true" : "false");

    getOwnedTriggers(root).forEach((trigger) => {
      trigger.setAttribute("data-tui-dialog-trigger-open", isOpen ? "true" : "false");
    });

    if (root?.id) {
      getTargetedTriggers(root.id).forEach((trigger) => {
        trigger.setAttribute("data-tui-dialog-trigger-open", isOpen ? "true" : "false");
      });
    }

  }

  function openDialog(target) {
    const root = getRoot(target);
    const dialog = getDialog(root);
    if (!dialog) return;

    window.clearTimeout(dialog._tuiDialogCloseTimer);
    delete dialog._tuiDialogCloseTimer;
    dialog.removeAttribute("data-tui-dialog-closing");
    root?.removeAttribute("data-tui-dialog-closing");

    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        return;
      }
    }

    updateState(root, true);
  }

  function closeDialog(target) {
    const root = getRoot(target);
    const dialog = getDialog(root);
    if (!dialog) return;

    if (!dialog.open) {
      updateState(root, false);
      return;
    }

    if (dialog.dataset.tuiDialogClosing === "true") {
      return;
    }

    dialog.setAttribute("data-tui-dialog-closing", "true");
    root?.setAttribute("data-tui-dialog-closing", "true");
    updateState(root, false);

    dialog._tuiDialogCloseTimer = window.setTimeout(() => {
      if (dialog.open) {
        dialog.close();
      } else {
        dialog.removeAttribute("data-tui-dialog-closing");
        root?.removeAttribute("data-tui-dialog-closing");
      }
    }, CLOSE_DURATION_MS);
  }

  function isDialogOpen(target) {
    return getDialog(getRoot(target))?.open || false;
  }

  function toggleDialog(target) {
    isDialogOpen(target) ? closeDialog(target) : openDialog(target);
  }

  function initDialogs(root = document) {
    root.querySelectorAll("[data-tui-dialog]").forEach((dialogRoot) => {
      const dialog = getDialog(dialogRoot);
      if (!dialog) return;

      ensureDialog(dialog);

      if (dialog.getAttribute("data-tui-dialog-initial-open") === "true") {
        openDialog(dialogRoot);
      } else {
        updateState(dialogRoot, dialog.open);
      }
    });
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-tui-dialog-trigger]");
    if (trigger) {
      toggleDialog(getRootForElement(trigger));
      return;
    }

    const closeButton = event.target.closest("[data-tui-dialog-close]");
    if (closeButton) {
      closeDialog(getRootForElement(closeButton));
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initDialogs());
  } else {
    initDialogs();
  }

  window.tui = window.tui || {};
  window.tui.dialog = {
    open: openDialog,
    close: closeDialog,
    toggle: toggleDialog,
    isOpen: isDialogOpen,
  };
})();
