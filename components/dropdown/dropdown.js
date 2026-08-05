(function () {
  'use strict';
  // Safari/iOS < 17 does not know the :popover-open selector and throws a
  // SyntaxError DOMException on matches() instead of returning false (#583).
  function matchesPopoverOpen(el) {
    if (!el) return false;
    try {
      return matchesPopoverOpen(el);
    } catch (e) {
      return false;
    }
  }

  
  document.addEventListener('click', (e) => {
    const item = e.target.closest('[data-tui-dropdown-item]');
    if (!item || 
        item.hasAttribute('data-tui-dropdown-submenu-trigger') ||
        item.getAttribute('data-tui-dropdown-prevent-close') === 'true') return;

    const popoverRoot = item.closest('[data-tui-popover-root]');
    const popoverContent = popoverRoot?.querySelector(':scope > [data-tui-popover-content]');
    if (!popoverContent?.matches(':popover-open')) return;

    try {
      popoverContent.hidePopover();
    } catch {
      // ignore
    }
  });
})();
