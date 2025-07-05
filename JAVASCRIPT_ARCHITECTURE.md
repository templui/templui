# JavaScript Architecture in templUI

## Current State and Issues

As of now, templUI's JavaScript component architecture lacks consistency across different components. This document outlines the current problems and proposes a standardized approach for all components going forward.

### Identified Issues

#### 1. **Inconsistent Instance Management**

- **Global Maps**: `modal.js`, `drawer.js` use `const modals = new Map()`
- **Window Object Storage**: `toast.js`, `popover.js` use `window.toasts = new Map()`
- **No Instance Tracking**: `dropdown.js`, `tabs.js`, `carousel.js` don't track instances globally
- **Memory Leak Risk**: No consistent cleanup pattern, potential for memory leaks

#### 2. **Mixed Public API Patterns**

- Most components expose only `init` method via `window.templUI.componentName`
- Some expose additional methods inconsistently (e.g., `popover` has `cleanup`)
- No standardized way to interact with component instances programmatically

#### 3. **Event Handling Inconsistencies**

- Direct event listeners vs. event delegation
- No consistent cleanup of event listeners
- Mixed approaches within single components

#### 4. **State Management**

- Some use Maps, others use closure variables
- No consistent pattern for accessing or modifying component state
- Difficult to debug or extend components

#### 5. **Initialization and Cleanup**

- Inconsistent duplicate initialization prevention
- Not all components have cleanup methods
- No standard lifecycle management

## Proposed Standard Architecture

### Core Principles

1. **Consistency**: All components follow the same pattern
2. **Performance**: Use WeakMap to prevent memory leaks
3. **Flexibility**: Support multiple interaction patterns
4. **Scalability**: Easy to extend and maintain
5. **Developer Experience**: Simple, intuitive API

### Standard Component Pattern

```javascript
(function () {
  "use strict";

  // Instance storage using WeakMap for automatic garbage collection
  const instances = new WeakMap();

  // Component class for encapsulation
  class ComponentName {
    constructor(element, options = {}) {
      this.element = element;
      this.options = { ...this.constructor.defaults, ...options };
      this.state = {};
      this.listeners = new Map();

      this.init();
    }

    static defaults = {
      // Default options
    };

    init() {
      // Initialize component
      this.element.setAttribute("data-initialized", "true");
    }

    // Public methods
    getValue() {
      /* ... */
    }
    setValue(value) {
      /* ... */
    }

    // Cleanup method
    destroy() {
      // Remove all event listeners
      this.listeners.forEach((handler, key) => {
        const [element, event] = key.split(":");
        element.removeEventListener(event, handler);
      });
      this.listeners.clear();

      // Clean up state
      this.element.removeAttribute("data-initialized");

      // Remove from instances
      instances.delete(this.element);
    }

    // Helper for managed event listeners
    addEventListener(element, event, handler) {
      element.addEventListener(event, handler);
      this.listeners.set(`${element}:${event}`, handler);
    }
  }

  // Public API
  window.templUI = window.templUI || {};
  window.templUI.componentName = {
    // Get instance by element or selector
    getInstance(selector) {
      const element =
        typeof selector === "string"
          ? document.querySelector(selector)
          : selector;
      return element ? instances.get(element) : null;
    },

    // Initialize components
    init(selector = "[data-component]") {
      const elements =
        typeof selector === "string"
          ? document.querySelectorAll(selector)
          : [selector];

      elements.forEach((element) => {
        if (!instances.has(element)) {
          const options = this.parseOptions(element);
          instances.set(element, new ComponentName(element, options));
        }
      });
    },

    // Destroy instances
    destroy(selector) {
      if (selector) {
        const instance = this.getInstance(selector);
        instance?.destroy();
      } else {
        // Destroy all instances
        instances.forEach((instance) => instance.destroy());
      }
    },

    // Parse data attributes for options
    parseOptions(element) {
      const options = {};
      // Parse data-* attributes
      return options;
    },

    // Convenience methods that proxy to instance methods
    setValue(selector, value) {
      const instance = this.getInstance(selector);
      return instance?.setValue(value);
    },

    getValue(selector) {
      const instance = this.getInstance(selector);
      return instance?.getValue();
    },
  };

  // Auto-initialization
  document.addEventListener("DOMContentLoaded", () => {
    window.templUI.componentName.init();
  });
})();
```

### Event System

Components should dispatch custom events for better integration:

```javascript
// Dispatch custom events
this.element.dispatchEvent(
  new CustomEvent("component:change", {
    detail: { value, previousValue },
    bubbles: true,
  }),
);

// Standard events per component type
// - component:init
// - component:change
// - component:destroy
// - component:error
```

### Data Attributes

Standardized data attributes for all components:

```html
<!-- Initialization -->
<div data-component data-component-option="value" data-initialized="true">
  <!-- Component-specific triggers -->
  <button data-component-trigger>Trigger</button>
  <button data-component-action="reset">Reset</button>
</div>
```

## Migration Strategy

1. **Phase 1**: Implement new pattern in new components (starting with selectbox)
2. **Phase 2**: Gradually refactor existing components
3. **Phase 3**: Deprecate old patterns
4. **Phase 4**: Remove legacy code

## Benefits

1. **Consistent API**: Developers learn one pattern for all components
2. **Better Memory Management**: WeakMap prevents memory leaks
3. **Improved Testing**: Standardized structure makes testing easier
4. **Enhanced DX**: Predictable behavior and clear documentation
5. **Future-Proof**: Easy to extend with new features

## Example: SelectBox with New Architecture

```javascript
// Initialize
window.templUI.selectbox.init("#my-select");

// Get instance and use methods
const select = window.templUI.selectbox.getInstance("#my-select");
select.setValue("option1");
select.reset();

// Or use convenience methods
window.templUI.selectbox.setValue("#my-select", "option1");
window.templUI.selectbox.reset("#my-select");

// Listen to events
document
  .querySelector("#my-select")
  .addEventListener("selectbox:change", (e) => {
    console.log("New value:", e.detail.value);
  });

// Cleanup when needed
window.templUI.selectbox.destroy("#my-select");
```

## Component Checklist

When implementing or refactoring a component, ensure:

- [ ] Uses WeakMap for instance storage
- [ ] Implements Component class pattern
- [ ] Has consistent public API
- [ ] Includes destroy/cleanup method
- [ ] Dispatches custom events
- [ ] Uses standardized data attributes
- [ ] Manages event listeners properly
- [ ] Prevents duplicate initialization
- [ ] Has comprehensive documentation
- [ ] Includes usage examples

## Conclusion

This standardized architecture will provide a solid foundation for all templUI components, ensuring consistency, maintainability, and excellent developer experience. The selectbox component will serve as the reference implementation for this new pattern.

## Todo/Done

- [x] selectbox

