(function () {
  "use strict";

  // Reactive Binding für checked property (wie bei Selectbox)
  function enableReactiveBinding(input) {
    if (input._tuiCheckbox) return;
    input._tuiCheckbox = true;

    var desc = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "checked"
    );
    if (!desc || !desc.set) return;

    Object.defineProperty(input, "checked", {
      get: desc.get,
      set: function (v) {
        var old = desc.get.call(this);
        desc.set.call(this, v);
        if (old !== v) {
          this.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      configurable: true,
    });
  }

  function updateParent(group) {
    var parent = document.querySelector(
      '[data-tui-checkbox-group="' + group + '"][data-tui-checkbox-parent]'
    );
    var children = document.querySelectorAll(
      '[data-tui-checkbox-group="' + group + '"]:not([data-tui-checkbox-parent])'
    );
    if (!parent || !children.length) return;

    var checked = 0;
    children.forEach(function (c) {
      if (c.checked) checked++;
    });

    parent.checked = checked === children.length;
    parent.indeterminate = checked > 0 && checked < children.length;
  }

  function toggleChildren(group, checked) {
    document
      .querySelectorAll(
        '[data-tui-checkbox-group="' + group + '"]:not([data-tui-checkbox-parent])'
      )
      .forEach(function (c) {
        c.checked = checked;
      });
  }

  document.addEventListener("change", function (e) {
    var el = e.target;
    if (!el.matches("[data-tui-checkbox-group]")) return;

    var group = el.getAttribute("data-tui-checkbox-group");
    if (el.hasAttribute("data-tui-checkbox-parent")) {
      toggleChildren(group, el.checked);
    } else {
      updateParent(group);
    }
  });

  function init() {
    var groups = new Set();
    document.querySelectorAll("[data-tui-checkbox-group]").forEach(function (el) {
      groups.add(el.getAttribute("data-tui-checkbox-group"));
      enableReactiveBinding(el);
    });
    groups.forEach(updateParent);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
