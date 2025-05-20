(function () {
  // IIFE
  if (typeof window.toastHandler === "undefined") {
    window.toastHandler = true;
    window.toasts = new Map();

    function initToast(toast) {
      if (window.toasts.has(toast)) return;

      const duration = parseInt(toast.dataset.duration || "0");
      const progress = toast.querySelector("[data-toast-progress]");
      const dismiss = toast.querySelector("[data-toast-dismiss]");

      const state = {
        timer: null,
        remaining: duration,
        startTime: Date.now(),
        progress: progress,
        paused: false,
      };
      window.toasts.set(toast, state);

      function removeToast() {
        clearTimeout(state.timer);
        toast.classList.remove("toast-enter-active");
        toast.classList.add("toast-leave-active");

        toast.addEventListener(
          "transitionend",
          () => {
            toast.remove();
            window.toasts.delete(toast);
          },
          { once: true }
        );
      }

      function startTimer(time) {
        if (time <= 0) return;

        clearTimeout(state.timer);
        state.startTime = Date.now();
        state.remaining = time;
        state.paused = false;
        state.timer = setTimeout(removeToast, time);

        if (state.progress) {
          state.progress.style.transition = `width ${time}ms linear`;
          void state.progress.offsetWidth;
          state.progress.style.width = "0%";
        }
      }

      function pauseTimer() {
        if (state.paused || state.remaining <= 0) return;

        clearTimeout(state.timer);
        state.remaining -= Date.now() - state.startTime;
        state.paused = true;

        if (state.progress) {
          const width = window.getComputedStyle(state.progress).width;
          state.progress.style.transition = "none";
          state.progress.style.width = width;
        }
      }

      function resumeTimer() {
        if (!state.paused || state.remaining <= 0) return;
        startTimer(state.remaining);
      }

      if (duration > 0) {
        toast.addEventListener("mouseenter", pauseTimer);
        toast.addEventListener("mouseleave", resumeTimer);
      }

      if (dismiss) {
        dismiss.addEventListener("click", removeToast);
      }

      setTimeout(() => {
        toast.classList.add("toast-enter-active");
        if (state.progress) {
          state.progress.style.width = "100%";
        }
        startTimer(duration);
      }, 50);
    }

    function initAllComponents(root = document) {
      const toastsToInit = [];
      if (root instanceof Element && root.matches("[data-toast]")) {
        if (!window.toasts.has(root)) {
          toastsToInit.push(root);
        }
      }
      if (root && typeof root.querySelectorAll === "function") {
        root.querySelectorAll("[data-toast]").forEach((toast) => {
          if (!window.toasts.has(toast)) {
            toastsToInit.push(toast);
          }
        });
      }
      toastsToInit.forEach(initToast);
    }

    const handleHtmxSwap = (event) => {
      const target = event.detail.elt;
      if (target instanceof Element) {
        requestAnimationFrame(() => initAllComponents(target));
      }
    };

    initAllComponents();
    document.addEventListener("DOMContentLoaded", () => initAllComponents());
    document.body.addEventListener("htmx:afterSwap", handleHtmxSwap);
    document.body.addEventListener("htmx:oobAfterSwap", handleHtmxSwap);
  }
})(); // End of IIFE
