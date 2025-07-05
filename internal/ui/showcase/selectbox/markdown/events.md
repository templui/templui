```javascript
// Listen to events
const select = document.querySelector("#my-select");

// Initialization complete
select.addEventListener("selectbox:init", (e) => {
  console.log("Initialized:", e.detail.instance);
});

// Value changed
select.addEventListener("selectbox:change", (e) => {
  console.log("New value:", e.detail.value);
  console.log("Previous value:", e.detail.previousValue);
  console.log("Changed item:", e.detail.item);
});

// Selection reset
select.addEventListener("selectbox:reset", (e) => {
  console.log("Previous value:", e.detail.previousValue);
});

// Instance destroyed
select.addEventListener("selectbox:destroy", (e) => {
  console.log("Destroyed:", e.detail.instance);
});
```

