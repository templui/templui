(function () {
  // IIFE
  function initAvatar(avatar) {
    const image = avatar.querySelector("[data-avatar-image]");
    const fallback = avatar.querySelector("[data-avatar-fallback]");

    if (image && fallback) {
      image.style.display = "none";
      fallback.style.display = "none";

      const showFallback = () => {
        image.style.display = "none";
        fallback.style.display = "";
      };

      const showImage = () => {
        image.style.display = "";
        fallback.style.display = "none";
      };

      if (image.complete) {
        image.naturalWidth > 0 && image.naturalHeight > 0
          ? showImage()
          : showFallback();
      } else {
        image.addEventListener("load", showImage, { once: true });
        image.addEventListener("error", showFallback, { once: true });

        setTimeout(() => {
          if (
            image.complete &&
            !(image.naturalWidth > 0 && image.naturalHeight > 0)
          ) {
            showFallback();
          }
        }, 50);
      }
    } else if (fallback) {
      fallback.style.display = "";
    } else if (image) {
      image.style.display = "";
    }
  }

  function initAllComponents(root = document) {
    if (root instanceof Element && root.matches("[data-avatar]")) {
      initAvatar(root);
    }

    for (const avatar of root.querySelectorAll("[data-avatar]")) {
      initAvatar(avatar);
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
