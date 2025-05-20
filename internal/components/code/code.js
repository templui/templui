import "./highlight.js";

(function () {
  function whenHljsReady(callback, attempt = 1) {
    if (window.hljs) {
      callback();
    } else if (attempt < 20) {
      // Retry for a few seconds
      setTimeout(() => whenHljsReady(callback, attempt + 1), 100);
    } else {
      console.error(
        "highlight.js (hljs) failed to load after several attempts."
      );
    }
  }

  function fallbackCopyText(text, iconCheck, iconClipboard) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      if (document.execCommand("copy")) {
        iconCheck.style.display = "inline";
        iconClipboard.style.display = "none";
        setTimeout(() => {
          iconCheck.style.display = "none";
          iconClipboard.style.display = "inline";
        }, 2000);
      }
    } catch (err) {
      console.error("Fallback copy failed", err);
    } finally {
      document.body.removeChild(textArea);
    }
  }

  function initCode(component) {
    if (!component || component._codeInitialized) return; // Basic initialized check

    const codeBlock = component.querySelector("[data-code-block]");
    const copyButton = component.querySelector("[data-copy-button]");
    const iconCheck = component.querySelector("[data-icon-check]");
    const iconClipboard = component.querySelector("[data-icon-clipboard]");

    // Highlight if hljs is available and not already highlighted
    if (codeBlock && window.hljs) {
      if (!codeBlock.classList.contains("hljs")) {
        window.hljs.highlightElement(codeBlock);
      }
    }

    // Setup copy button if elements exist
    if (copyButton && codeBlock && iconCheck && iconClipboard) {
      // Remove previous listener if any (important for re-initialization)
      const oldListener = copyButton._copyListener;
      if (oldListener) {
        copyButton.removeEventListener("click", oldListener);
      }

      const newListener = () => {
        const codeToCopy = codeBlock.textContent || "";

        const showCopied = () => {
          iconCheck.style.display = "inline";
          iconClipboard.style.display = "none";
          setTimeout(() => {
            iconCheck.style.display = "none";
            iconClipboard.style.display = "inline";
          }, 2000);
        };

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard
            .writeText(codeToCopy)
            .then(showCopied)
            .catch(() =>
              fallbackCopyText(codeToCopy, iconCheck, iconClipboard)
            );
        } else {
          fallbackCopyText(codeToCopy, iconCheck, iconClipboard);
        }
      };

      copyButton.addEventListener("click", newListener);
      copyButton._copyListener = newListener; // Store listener for removal
    }

    component._codeInitialized = true; // Mark as initialized
  }

  function initAllComponents(root = document) {
    if (root instanceof Element && root.matches("[data-code-component]")) {
      initCode(root);
    }
    for (const component of root.querySelectorAll("[data-code-component]")) {
      initCode(component);
    }
  }

  const handleHtmxSwap = (event) => {
    const target = event.detail.elt;
    if (target instanceof Element) {
      whenHljsReady(() => initAllComponents(target));
    }
  };

  initAllComponents();
  document.addEventListener("DOMContentLoaded", () => {
    whenHljsReady(() => initAllComponents());
  });
  document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);
})();
