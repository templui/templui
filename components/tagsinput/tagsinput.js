(function () {
  'use strict';

  function getSelectedTags(container) {
    return Array.from(container.querySelectorAll('[data-tui-tagsinput-hidden-inputs] input'))
      .map(i => i.value.toLowerCase());
  }

  function showSuggestions(container, query) {
    const id = container.getAttribute('data-tui-tagsinput-suggestions-id');
    if (!id) return;
    const popup = document.getElementById(id);
    if (!popup) return;

    const selected = getSelectedTags(container);
    const q = query.toLowerCase().trim();
    let first = null;

    popup.querySelectorAll('[data-tui-tagsinput-suggestion]').forEach(el => {
      const val = el.getAttribute('data-tui-tagsinput-suggestion-value').toLowerCase();
      const show = !selected.includes(val) && val.includes(q);
      el.style.display = show ? '' : 'none';
      el.classList.remove('bg-accent');
      if (show && !first) {
        first = el;
      }
    });

    if (first) {
      first.classList.add('bg-accent');
      window.tui?.popover?.open(id);
    } else {
      window.tui?.popover?.close(id);
    }
  }

  function getVisibleSuggestions(container) {
    const id = container.getAttribute('data-tui-tagsinput-suggestions-id');
    if (!id) return [];
    const popup = document.getElementById(id);
    if (!popup) return [];
    return Array.from(popup.querySelectorAll('[data-tui-tagsinput-suggestion]'))
      .filter(el => el.style.display !== 'none');
  }

  function moveSelection(container, dir) {
    const items = getVisibleSuggestions(container);
    if (!items.length) return;

    const current = items.findIndex(el => el.classList.contains('bg-accent'));
    items.forEach(el => el.classList.remove('bg-accent'));

    let next = dir === 'down' ? current + 1 : current - 1;
    if (next >= items.length) next = 0;
    if (next < 0) next = items.length - 1;

    items[next].classList.add('bg-accent');
    items[next].scrollIntoView({ block: 'nearest' });
  }

  function addTag(container, value) {
    const input = container.querySelector('[data-tui-tagsinput-text-input]');
    const val = value.trim();
    if (!val || input?.disabled) return;

    if (getSelectedTags(container).includes(val.toLowerCase())) {
      input.value = '';
      return;
    }

    // Create chip
    const chip = document.createElement('div');
    chip.className = 'inline-flex items-center gap-2 rounded-md border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary text-primary-foreground';
    chip.setAttribute('data-tui-tagsinput-chip', '');
    chip.innerHTML = `<span>${val}</span><button type="button" class="ml-1 hover:text-destructive cursor-pointer" data-tui-tagsinput-remove><svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>`;

    // Add chip to chips container
    container.querySelector('[data-tui-tagsinput-chips]').appendChild(chip);

    // Add hidden input
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = container.getAttribute('data-tui-tagsinput-name') || '';
    hidden.value = val;
    container.querySelector('[data-tui-tagsinput-hidden-inputs]').appendChild(hidden);

    input.value = '';
  }

  // Focus → show suggestions
  document.addEventListener('focusin', e => {
    const input = e.target.closest('[data-tui-tagsinput-text-input]');
    if (!input) return;
    const container = input.closest('[data-tui-tagsinput]');
    if (container) showSuggestions(container, input.value);
  });

  // Focusout → close suggestions
  document.addEventListener('focusout', e => {
    const input = e.target.closest('[data-tui-tagsinput-text-input]');
    if (!input) return;
    const container = input.closest('[data-tui-tagsinput]');
    const id = container?.getAttribute('data-tui-tagsinput-suggestions-id');
    if (id) window.tui?.popover?.close(id);
  });

  // Input → filter suggestions
  document.addEventListener('input', e => {
    const input = e.target.closest('[data-tui-tagsinput-text-input]');
    if (!input) return;
    const container = input.closest('[data-tui-tagsinput]');
    if (container) showSuggestions(container, input.value);
  });

  // Suggestion selection (mousedown to fire before focusout)
  document.addEventListener('mousedown', e => {
    const suggestion = e.target.closest('[data-tui-tagsinput-suggestion]');
    if (!suggestion) return;
    e.preventDefault(); // Prevent focus change
    const popup = suggestion.closest('[data-tui-popover-id]');
    const container = document.querySelector(`[data-tui-tagsinput-suggestions-id="${popup?.id}"]`);
    if (container) {
      addTag(container, suggestion.getAttribute('data-tui-tagsinput-suggestion-value'));
      showSuggestions(container, '');
    }
  });

  // Click
  document.addEventListener('click', e => {
    // Click on input → show suggestions (handles re-click on already focused input)
    const inputClick = e.target.closest('[data-tui-tagsinput-text-input]');
    if (inputClick) {
      const container = inputClick.closest('[data-tui-tagsinput]');
      if (container) showSuggestions(container, inputClick.value);
      return;
    }

    // Remove click
    const remove = e.target.closest('[data-tui-tagsinput-remove]');
    if (remove) {
      const chip = remove.closest('[data-tui-tagsinput-chip]');
      const container = chip?.closest('[data-tui-tagsinput]');
      const val = chip?.querySelector('span')?.textContent;
      chip?.remove();
      container?.querySelector(`[data-tui-tagsinput-hidden-inputs] input[value="${val}"]`)?.remove();
      return;
    }

    // Click on container → focus input
    const container = e.target.closest('[data-tui-tagsinput]');
    if (container && !e.target.closest('input')) {
      container.querySelector('[data-tui-tagsinput-text-input]')?.focus();
    }
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    const input = e.target.closest('[data-tui-tagsinput-text-input]');
    if (!input) return;
    const container = input.closest('[data-tui-tagsinput]');
    if (!container) return;

    const id = container.getAttribute('data-tui-tagsinput-suggestions-id');
    const isOpen = id && window.tui?.popover?.isOpen(id);

    if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      moveSelection(container, 'down');
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      moveSelection(container, 'up');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const items = getVisibleSuggestions(container);
      const selected = items.find(el => el.classList.contains('bg-accent'));
      if (selected) {
        addTag(container, selected.getAttribute('data-tui-tagsinput-suggestion-value'));
        showSuggestions(container, '');
      } else {
        addTag(container, input.value);
        showSuggestions(container, '');
      }
    } else if (e.key === ',') {
      e.preventDefault();
      addTag(container, input.value);
      showSuggestions(container, '');
    } else if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      window.tui?.popover?.close(id);
    } else if (e.key === 'Backspace' && input.value === '') {
      const chipsContainer = container.querySelector('[data-tui-tagsinput-chips]');
      const lastChip = chipsContainer?.lastElementChild;
      if (lastChip) {
        const val = lastChip.querySelector('span')?.textContent;
        lastChip.remove();
        container.querySelector(`[data-tui-tagsinput-hidden-inputs] input[value="${val}"]`)?.remove();
      }
    }
  });
})();
