(function () {
  'use strict';

  document.addEventListener('click', (e) => {
    const item = e.target.closest('[data-tui-dropdown-item]');
    if (!item || 
        item.hasAttribute('data-tui-dropdown-submenu-trigger') ||
        item.getAttribute('data-tui-dropdown-prevent-close') === 'true') return;

    window.tui?.popover?.closeNearest?.(item);
  });
})();
