(function () {
  'use strict';
  
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
