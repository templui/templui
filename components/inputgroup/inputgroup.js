(function () {
  "use strict";

  // shadcn's InputGroupAddon focuses the group's input when clicked, unless
  // the click landed on a button.
  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const addon = e.target.closest('[data-slot="input-group-addon"]');
    if (!addon || e.target.closest("button")) return;
    const input = addon.parentElement && addon.parentElement.querySelector("input");
    if (input) input.focus();
  });
})();
