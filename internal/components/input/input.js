(function () {
  function initPasswordToggle(button) {
    if (button.hasAttribute("data-password-initialized")) {
      return;
    }

    button.setAttribute("data-password-initialized", "true");

    button.addEventListener("click", function (event) {
      const inputId = button.getAttribute("data-toggle-password");
      const input = document.getElementById(inputId);
      if (input) {
        const iconOpen = button.querySelector(".icon-open");
        const iconClosed = button.querySelector(".icon-closed");

        if (input.type === "password") {
          input.type = "text";
          iconOpen.classList.add("hidden");
          iconClosed.classList.remove("hidden");
        } else {
          input.type = "password";
          iconOpen.classList.remove("hidden");
          iconClosed.classList.add("hidden");
        }
      }
    });
  }

  function initAllComponents(root = document) {
    const buttons = root.querySelectorAll(
      "[data-toggle-password]:not([data-password-initialized])"
    );
    buttons.forEach((button) => {
      initPasswordToggle(button);
    });
  }

  const handleHtmxSwap = (event) => {
    const target = event.detail.elt;
    if (target instanceof Element) {
      requestAnimationFrame(() => initAllComponents(target));
    }
  };

  initAllComponents();
  document.addEventListener("DOMContentLoaded", () => initAllComponents());
  document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
  document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);
})();
