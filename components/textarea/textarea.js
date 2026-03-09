(function () {
  'use strict';
  
  // Auto-resize handler
  document.addEventListener('input', (e) => {
    const textarea = e.target.closest('textarea[data-tui-textarea]');
    if (!textarea || textarea.getAttribute('data-tui-textarea-auto-resize') !== 'true') return;
    
    const minHeight = textarea.style.minHeight || window.getComputedStyle(textarea).minHeight;
    textarea.style.height = minHeight;
    textarea.style.height = `${textarea.scrollHeight}px`;
  });
  
  // MutationObserver for initial setup
  new MutationObserver(() => {
    document.querySelectorAll('textarea[data-tui-textarea][data-tui-textarea-auto-resize="true"]').forEach(textarea => {
      if (!textarea.style.height || textarea.style.height === textarea.style.minHeight) {
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });
  }).observe(document.body, { childList: true, subtree: true });
})();