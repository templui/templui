(function () {
  "use strict";

  // Handle image load events
  document.addEventListener(
    "load",
    function (e) {
      if (e.target.matches("[data-tui-avatar-image]")) {
        const fallback = e.target.parentElement.querySelector(
          "[data-tui-avatar-fallback]",
        );
        if (fallback) {
          fallback.style.display = "none";
        }
      }
    },
    true,
  );

  // Handle image error events
  document.addEventListener(
    "error",
    function (e) {
      if (e.target.matches("[data-tui-avatar-image]")) {
        e.target.style.display = "none";
        const fallback = e.target.parentElement.querySelector(
          "[data-tui-avatar-fallback]",
        );
        if (fallback) {
          fallback.style.display = "flex";
        }
      }
    },
    true,
  );

  // Check already loaded/broken images on DOM ready
  function checkImages() {
    document
      .querySelectorAll("[data-tui-avatar-image]")
      .forEach(function (img) {
        const fallback = img.parentElement.querySelector(
          "[data-tui-avatar-fallback]",
        );

        // Image already successfully loaded
        if (img.complete && img.naturalWidth > 0) {
          if (fallback) fallback.style.display = "none";
        }
        // Image already failed
        else if (img.complete && img.naturalWidth === 0) {
          img.style.display = "none";
          if (fallback) fallback.style.display = "flex";
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkImages);
  } else {
    checkImages();
  }
})();
