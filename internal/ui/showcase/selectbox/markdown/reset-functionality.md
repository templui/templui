```javascript
// Option 1: Internal reset button
<div data-show-reset="true">
  @selectbox.SelectBox() { ... }
</div>

// Option 2: External reset trigger
<button data-selectbox-reset="#my-select">Clear Selection</button>

// Option 3: Programmatic reset
window.templUI.selectbox.reset('#my-select');
```