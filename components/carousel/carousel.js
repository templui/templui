(function () {
  "use strict";

  // Minimal embla-like engine: slides snap to their offsets, the track
  // translates, drag swipes one slide, buttons disable at the edges.
  const DRAG_THRESHOLD = 40; // px before a drag counts as a swipe

  const instances = new WeakMap();

  function setup(root) {
    if (instances.has(root)) return;
    const viewport = root.querySelector("[data-tui-carousel-viewport]");
    const track = root.querySelector("[data-tui-carousel-track]");
    if (!viewport || !track) return;

    const state = {
      root,
      viewport,
      track,
      index: 0,
      horizontal: root.getAttribute("data-tui-carousel-orientation") !== "vertical",
      loop: root.getAttribute("data-tui-carousel-loop") === "true",
      autoplay: root.getAttribute("data-tui-carousel-autoplay") === "true",
      interval: parseInt(root.getAttribute("data-tui-carousel-interval"), 10) || 5000,
      timer: null,
    };
    instances.set(root, state);

    track.addEventListener("pointerdown", (e) => onDragStart(state, e));
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollPrev(state);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollNext(state);
      }
    });

    if (state.autoplay) {
      startAutoplay(state);
      root.addEventListener("mouseenter", () => stopAutoplay(state));
      root.addEventListener("mouseleave", () => startAutoplay(state));
    }

    update(state, false);
  }

  function items(state) {
    return [...state.track.querySelectorAll("[data-tui-carousel-item]")].filter(
      (item) => item.parentElement === state.track,
    );
  }

  // Snap offsets per slide, clamped so the last snap keeps the track's end
  // aligned with the viewport edge (embla's trimSnaps).
  function snaps(state) {
    const viewportSize = state.horizontal
      ? state.viewport.clientWidth
      : state.viewport.clientHeight;
    const trackSize = state.horizontal ? state.track.scrollWidth : state.track.scrollHeight;
    const max = Math.max(0, trackSize - viewportSize);
    const points = [];
    for (const item of items(state)) {
      const offset = Math.min(state.horizontal ? item.offsetLeft : item.offsetTop, max);
      if (!points.length || points[points.length - 1] < offset) points.push(offset);
    }
    return points.length ? points : [0];
  }

  function update(state, animate) {
    const points = snaps(state);
    state.index = Math.max(0, Math.min(state.index, points.length - 1));
    const offset = points[state.index];

    state.track.style.transition = animate ? "transform 300ms ease" : "none";
    state.track.style.transform = state.horizontal
      ? "translate3d(" + -offset + "px, 0, 0)"
      : "translate3d(0, " + -offset + "px, 0)";

    const prev = state.root.querySelector("[data-tui-carousel-prev]");
    const next = state.root.querySelector("[data-tui-carousel-next]");
    if (prev) prev.disabled = !state.loop && state.index === 0;
    if (next) next.disabled = !state.loop && state.index >= points.length - 1;
  }

  function scrollPrev(state) {
    const count = snaps(state).length;
    if (state.index > 0) {
      state.index -= 1;
    } else if (state.loop) {
      state.index = count - 1;
    } else {
      return;
    }
    update(state, true);
  }

  function scrollNext(state) {
    const count = snaps(state).length;
    if (state.index < count - 1) {
      state.index += 1;
    } else if (state.loop) {
      state.index = 0;
    } else {
      return;
    }
    update(state, true);
  }

  // ----- drag -----------------------------------------------------------------

  function onDragStart(state, e) {
    if (e.button !== 0) return;
    const startCoord = state.horizontal ? e.clientX : e.clientY;
    const startOffset = snaps(state)[state.index] || 0;
    let delta = 0;

    const onMove = (ev) => {
      delta = (state.horizontal ? ev.clientX : ev.clientY) - startCoord;
      state.track.style.transition = "none";
      state.track.style.transform = state.horizontal
        ? "translate3d(" + (-startOffset + delta) + "px, 0, 0)"
        : "translate3d(0, " + (-startOffset + delta) + "px, 0)";
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (delta <= -DRAG_THRESHOLD) {
        scrollNext(state);
      } else if (delta >= DRAG_THRESHOLD) {
        scrollPrev(state);
      } else {
        update(state, true);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // ----- autoplay ---------------------------------------------------------------

  function startAutoplay(state) {
    stopAutoplay(state);
    state.timer = setInterval(() => {
      const count = snaps(state).length;
      state.index = state.index >= count - 1 ? 0 : state.index + 1;
      update(state, true);
    }, state.interval);
  }

  function stopAutoplay(state) {
    clearInterval(state.timer);
    state.timer = null;
  }

  // ----- events -----------------------------------------------------------------

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const button = e.target.closest("[data-tui-carousel-prev], [data-tui-carousel-next]");
    const root = button?.closest("[data-tui-carousel]");
    if (!root) return;
    const state = instances.get(root);
    if (!state) return;
    if (button.hasAttribute("data-tui-carousel-prev")) {
      scrollPrev(state);
    } else {
      scrollNext(state);
    }
  });

  window.addEventListener("resize", () => {
    document.querySelectorAll("[data-tui-carousel]").forEach((root) => {
      const state = instances.get(root);
      if (state) update(state, false);
    });
  });

  function init() {
    document.querySelectorAll("[data-tui-carousel]").forEach(setup);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes.length) {
        init();
        break;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
