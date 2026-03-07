(function () {
  'use strict';
  
  document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-tui-input-toggle-password]');
    if (!button) return;
    
    const inputId = button.getAttribute('data-tui-input-toggle-password');
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const iconOpen = button.querySelector('.icon-open');
    const iconClosed = button.querySelector('.icon-closed');
    
    if (input.type === 'password') {
      input.type = 'text';
      if (iconOpen) iconOpen.classList.add('hidden');
      if (iconClosed) iconClosed.classList.remove('hidden');
    } else {
      input.type = 'password';
      if (iconOpen) iconOpen.classList.remove('hidden');
      if (iconClosed) iconClosed.classList.add('hidden');
    }
  });
})();
