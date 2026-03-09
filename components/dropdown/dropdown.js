(function () {
  'use strict';
  
  document.addEventListener('click', (e) => {
    const item = e.target.closest('[data-tui-dropdown-item]');
    if (!item || 
        item.hasAttribute('data-tui-dropdown-submenu-trigger') ||
        item.getAttribute('data-tui-dropdown-prevent-close') === 'true') return;
    
    const popoverContent = item.closest('[data-tui-popover-id]');
    if (!popoverContent) return;
    
    const popoverId = popoverContent.getAttribute('data-tui-popover-id') || popoverContent.id;
    if (window.closePopover) window.closePopover(popoverId);
  });
})();