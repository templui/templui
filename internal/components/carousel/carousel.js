(function () {
  // IIFE
  function initCarousel(carousel) {
    const track = carousel.querySelector(".carousel-track");
    const items = Array.from(track?.querySelectorAll(".carousel-item") || []);
    if (items.length === 0) return;

    const indicators = Array.from(
      carousel.querySelectorAll(".carousel-indicator")
    );
    const prevBtn = carousel.querySelector(".carousel-prev");
    const nextBtn = carousel.querySelector(".carousel-next");

    const state = {
      currentIndex: 0,
      slideCount: items.length,
      autoplay: carousel.dataset.autoplay === "true",
      interval: parseInt(carousel.dataset.interval || 5000),
      loop: carousel.dataset.loop === "true",
      autoplayInterval: null,
      isHovering: false,
      touchStartX: 0,
    };

    function updateTrackPosition() {
      track.style.transform = `translateX(-${state.currentIndex * 100}%)`;
    }

    function updateIndicators() {
      indicators.forEach((indicator, i) => {
        if (i < state.slideCount) {
          if (i === state.currentIndex) {
            indicator.classList.add("bg-white");
            indicator.classList.remove("bg-white/50");
          } else {
            indicator.classList.remove("bg-white");
            indicator.classList.add("bg-white/50");
          }
          indicator.style.display = "";
        } else {
          indicator.style.display = "none";
        }
      });
    }

    function updateButtons() {
      if (prevBtn) {
        prevBtn.disabled = !state.loop && state.currentIndex === 0;
        prevBtn.classList.toggle("opacity-50", prevBtn.disabled);
        prevBtn.classList.toggle("cursor-not-allowed", prevBtn.disabled);
      }

      if (nextBtn) {
        nextBtn.disabled =
          !state.loop && state.currentIndex === state.slideCount - 1;
        nextBtn.classList.toggle("opacity-50", nextBtn.disabled);
        nextBtn.classList.toggle("cursor-not-allowed", nextBtn.disabled);
      }
    }

    function startAutoplay() {
      if (state.autoplayInterval) {
        clearInterval(state.autoplayInterval);
      }

      if (state.autoplay) {
        state.autoplayInterval = setInterval(() => {
          if (!state.isHovering) {
            goToNext();
          }
        }, state.interval);
      }
    }

    function stopAutoplay() {
      if (state.autoplayInterval) {
        clearInterval(state.autoplayInterval);
        state.autoplayInterval = null;
      }
    }

    function goToNext() {
      let nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.slideCount) {
        if (state.loop) {
          nextIndex = 0;
        } else {
          return;
        }
      }
      goToSlide(nextIndex);
    }

    function goToPrev() {
      let prevIndex = state.currentIndex - 1;
      if (prevIndex < 0) {
        if (state.loop) {
          prevIndex = state.slideCount - 1;
        } else {
          return;
        }
      }
      goToSlide(prevIndex);
    }

    function goToSlide(index) {
      if (index < 0 || index >= state.slideCount) {
        if (state.loop) {
          index = (index + state.slideCount) % state.slideCount;
        } else {
          return;
        }
      }

      if (index === state.currentIndex) return;

      state.currentIndex = index;
      updateTrackPosition();
      updateIndicators();
      updateButtons();

      if (state.autoplay && !state.isHovering) {
        stopAutoplay();
        startAutoplay();
      }
    }

    if (track) {
      track.addEventListener(
        "touchstart",
        (e) => {
          state.touchStartX = e.touches[0].clientX;
        },
        { passive: true }
      );

      track.addEventListener(
        "touchend",
        (e) => {
          const touchEndX = e.changedTouches[0].clientX;
          const diff = state.touchStartX - touchEndX;
          const sensitivity = 50;

          if (Math.abs(diff) > sensitivity) {
            diff > 0 ? goToNext() : goToPrev();
          }
        },
        { passive: true }
      );
    }

    indicators.forEach((indicator, index) => {
      if (index < state.slideCount) {
        indicator.addEventListener("click", () => goToSlide(index));
      }
    });

    if (prevBtn) prevBtn.addEventListener("click", goToPrev);
    if (nextBtn) nextBtn.addEventListener("click", goToNext);

    carousel.addEventListener("mouseenter", () => {
      state.isHovering = true;
      if (state.autoplay) stopAutoplay();
    });

    carousel.addEventListener("mouseleave", () => {
      state.isHovering = false;
      if (state.autoplay) startAutoplay();
    });

    updateTrackPosition();
    updateIndicators();
    updateButtons();

    if (state.autoplay) startAutoplay();
  }

  function initAllComponents(root = document) {
    if (root instanceof Element && root.matches(".carousel-component")) {
      initCarousel(root);
    }
    for (const carousel of root.querySelectorAll(".carousel-component")) {
      initCarousel(carousel);
    }
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
})(); // End of IIFE
