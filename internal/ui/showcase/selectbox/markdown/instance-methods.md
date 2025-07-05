```javascript
// Get instance
const select = window.templUI.selectbox.getInstance('#my-select');

// Get value
const value = select.getValue(); // Single: string or null, Multiple: array

// Set value
select.setValue('option1'); // Single selection
select.setValue(['option1', 'option2']); // Multiple selection

// Reset selection
select.reset();

// Enable/Disable
select.enable();
select.disable();

// Destroy instance
select.destroy();
```