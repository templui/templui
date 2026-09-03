(function () {
  "use strict";

  const components = new Map();
  const attributeComponents = new Map();
  const observedAttributes = new Set();
  const scrollLockOwners = new Set();
  let scrollLockStyles;
  let observer;
  let started = false;

  function elements(root, selector) {
    if (!selector || !root?.querySelectorAll) return [];
    const result = root instanceof Element && root.matches(selector) ? [root] : [];
    result.push(...root.querySelectorAll(selector));
    return result;
  }

  function mountComponent(component, root) {
    for (const element of elements(root, component.selector)) {
      if (component.instances.has(element)) continue;
      const cleanup = component.setup(element);
      component.instances.set(element, typeof cleanup === "function" ? cleanup : null);
    }
    component.mount?.(root);
  }

  function unmountComponent(component, root) {
    for (const element of elements(root, component.selector)) {
      if (!component.instances.has(element)) continue;
      component.instances.get(element)?.();
      component.instances.delete(element);
    }
    component.unmount?.(root);
  }

  function mount(root) {
    if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
    for (const component of components.values()) mountComponent(component, root);
  }

  function unmount(root) {
    if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
    for (const component of components.values()) unmountComponent(component, root);
  }

  function onMutations(records) {
    for (const record of records) {
      if (record.type === "attributes") {
        for (const component of attributeComponents.get(record.attributeName) || []) {
          if (
            component.attributeChanged &&
            record.target.matches(component.selector)
          ) {
            component.attributeChanged(record.target, record.attributeName);
          }
        }
        continue;
      }

      record.removedNodes.forEach(unmount);
      record.addedNodes.forEach(mount);
    }
  }

  function observe() {
    if (!started) return;
    observer?.disconnect();
    observer ||= new MutationObserver(onMutations);

    const options = { childList: true, subtree: true };
    if (observedAttributes.size > 0) {
      options.attributes = true;
      options.attributeFilter = [...observedAttributes];
    }
    observer.observe(document.documentElement, options);
  }

  function start() {
    if (started) return;
    started = true;
    mount(document);
    observe();
  }

  // Native controls do not emit input/change when code assigns .value or
  // .checked. Reactive libraries use those property assignments, so component
  // adapters can watch the real form control without knowing which library
  // performed the write.
  function watchProperty(element, property, changed) {
    if (!element || typeof changed !== "function") return;

    const ownDescriptor = Object.getOwnPropertyDescriptor(element, property);
    let owner = element;
    let descriptor = ownDescriptor;
    while (!descriptor && (owner = Object.getPrototypeOf(owner))) {
      descriptor = Object.getOwnPropertyDescriptor(owner, property);
    }
    if (!descriptor?.get || !descriptor?.set) return;

    Object.defineProperty(element, property, {
      configurable: true,
      enumerable: descriptor.enumerable,
      get() {
        return descriptor.get.call(this);
      },
      set(value) {
        const previous = descriptor.get.call(this);
        descriptor.set.call(this, value);
        const next = descriptor.get.call(this);
        if (!Object.is(previous, next)) changed(next, previous);
      },
    });

    return () => {
      if (ownDescriptor) Object.defineProperty(element, property, ownDescriptor);
      else delete element[property];
    };
  }

  function register(name, definition) {
    if (!name || components.has(name)) {
      throw new Error("Duplicate shadcn-templ component lifecycle: " + name);
    }

    const component = {
      ...definition,
      attributes: definition.attributes || [],
      instances: new WeakMap(),
    };
    if (component.selector && typeof component.setup !== "function") {
      throw new Error("Missing setup for shadcn-templ lifecycle: " + name);
    }

    components.set(name, component);
    component.attributes.forEach((attribute) => {
      observedAttributes.add(attribute);
      if (!attributeComponents.has(attribute)) {
        attributeComponents.set(attribute, new Set());
      }
      attributeComponents.get(attribute).add(component);
    });

    if (started) {
      mountComponent(component, document);
      observe();
    }
  }

  function setScrollLocked(owner, locked) {
    if (locked) scrollLockOwners.add(owner);
    else scrollLockOwners.delete(owner);

    if (scrollLockOwners.size > 0 && !scrollLockStyles) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      scrollLockStyles = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
      };
      document.body.style.overflow = "hidden";
      if (scrollbar > 0) document.body.style.paddingRight = scrollbar + "px";
    } else if (scrollLockOwners.size === 0 && scrollLockStyles) {
      document.body.style.overflow = scrollLockStyles.overflow;
      document.body.style.paddingRight = scrollLockStyles.paddingRight;
      scrollLockStyles = undefined;
    }
  }

  window.shadcnTempl = Object.assign(window.shadcnTempl || {}, {
    lifecycle: Object.freeze({ register, watchProperty }),
    setScrollLocked,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
