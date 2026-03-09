(function() {
  'use strict';
  
  const autoplays = new Map();
  let dragState = null;
  
  // Click handling for navigation
  document.addEventListener('click', (e) => {
    const prevBtn = e.target.closest('[data-tui-carousel-prev]');
    if (prevBtn) {
      const carousel = prevBtn.closest('[data-tui-carousel]');
      if (carousel) navigate(carousel, -1);
      return;
    }
    
    const nextBtn = e.target.closest('[data-tui-carousel-next]');
    if (nextBtn) {
      const carousel = nextBtn.closest('[data-tui-carousel]');
      if (carousel) navigate(carousel, 1);
      return;
    }
    
    const indicator = e.target.closest('[data-tui-carousel-indicator]');
    if (indicator) {
      const carousel = indicator.closest('[data-tui-carousel]');
      const index = parseInt(indicator.dataset.tuiCarouselIndicator);
      if (carousel && !isNaN(index)) {
        updateCarousel(carousel, index);
      }
    }
  });
  
  // Drag/swipe handling
  function startDrag(e) {
    const track = e.target.closest('[data-tui-carousel-track]');
    if (!track) return;
    
    const carousel = track.closest('[data-tui-carousel]');
    if (!carousel) return;
    
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    
    dragState = {
      carousel,
      track,
      startX: clientX,
      currentX: clientX,
      startTime: Date.now()
    };
    
    track.style.cursor = 'grabbing';
    track.style.transition = 'none';
    stopAutoplay(carousel);
  }
  
  function doDrag(e) {
    if (!dragState) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragState.currentX = clientX;
    
    const diff = clientX - dragState.startX;
    const currentIndex = parseInt(dragState.carousel.dataset.tuiCarouselCurrent || '0');
    const offset = -currentIndex * 100 + (diff / dragState.track.offsetWidth) * 100;
    
    dragState.track.style.transform = `translateX(${offset}%)`;
  }
  
  function endDrag(e) {
    if (!dragState) return;
    
    const { carousel, track, startX, startTime } = dragState;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : (e.clientX || dragState.currentX);
    
    track.style.cursor = '';
    track.style.transition = '';
    
    const diff = startX - clientX;
    const velocity = Math.abs(diff) / (Date.now() - startTime);
    
    if (Math.abs(diff) > 50 || velocity > 0.5) {
      navigate(carousel, diff > 0 ? 1 : -1);
    } else {
      const currentIndex = parseInt(carousel.dataset.tuiCarouselCurrent || '0');
      updateCarousel(carousel, currentIndex);
    }
    
    dragState = null;
    
    if (carousel.dataset.tuiCarouselAutoplay === 'true' && !carousel.matches(':hover')) {
      startAutoplay(carousel);
    }
  }
  
  document.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('mouseleave', (e) => {
    if (e.target === document.documentElement) endDrag(e);
  });
  
  document.addEventListener('touchstart', startDrag, { passive: false });
  document.addEventListener('touchmove', doDrag, { passive: false });
  document.addEventListener('touchend', endDrag, { passive: false });
  
  // Navigation logic
  function navigate(carousel, direction) {
    const current = parseInt(carousel.dataset.tuiCarouselCurrent || '0');
    const items = carousel.querySelectorAll('[data-tui-carousel-item]');
    const count = items.length;
    
    if (count === 0) return;
    
    let next = current + direction;
    
    if (carousel.dataset.tuiCarouselLoop === 'true') {
      next = ((next % count) + count) % count;
    } else {
      next = Math.max(0, Math.min(next, count - 1));
    }
    
    updateCarousel(carousel, next);
  }
  
  function updateCarousel(carousel, index) {
    const track = carousel.querySelector('[data-tui-carousel-track]');
    const indicators = carousel.querySelectorAll('[data-tui-carousel-indicator]');
    const prevBtn = carousel.querySelector('[data-tui-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-tui-carousel-next]');
    const items = carousel.querySelectorAll('[data-tui-carousel-item]');
    const count = items.length;
    
    carousel.dataset.tuiCarouselCurrent = index;
    
    if (track) {
      track.style.transform = `translateX(-${index * 100}%)`;
    }
    
    indicators.forEach((ind, i) => {
      ind.dataset.tuiCarouselActive = (i === index) ? 'true' : 'false';
      ind.classList.toggle('bg-primary', i === index);
      ind.classList.toggle('bg-foreground/30', i !== index);
    });
    
    const isLoop = carousel.dataset.tuiCarouselLoop === 'true';
    
    if (prevBtn) {
      prevBtn.disabled = !isLoop && index === 0;
      prevBtn.classList.toggle('opacity-50', prevBtn.disabled);
    }
    
    if (nextBtn) {
      nextBtn.disabled = !isLoop && index === count - 1;
      nextBtn.classList.toggle('opacity-50', nextBtn.disabled);
    }
  }
  
  // Autoplay functionality
  function startAutoplay(carousel) {
    if (carousel.dataset.tuiCarouselAutoplay !== 'true') return;
    
    stopAutoplay(carousel);
    
    const interval = parseInt(carousel.dataset.tuiCarouselInterval || '5000');
    const id = setInterval(() => {
      if (!document.contains(carousel)) {
        stopAutoplay(carousel);
        return;
      }
      
      if (carousel.matches(':hover') || dragState?.carousel === carousel) {
        return;
      }
      
      navigate(carousel, 1);
    }, interval);
    
    autoplays.set(carousel, id);
  }
  
  function stopAutoplay(carousel) {
    const id = autoplays.get(carousel);
    if (id) {
      clearInterval(id);
      autoplays.delete(carousel);
    }
  }
  
  // Intersection Observer for visibility management
  const observedCarousels = new WeakSet();
  const carouselObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const carousel = entry.target;
      
      // Initialize display on first observation
      if (!carousel.hasAttribute('data-tui-carousel-initialized')) {
        carousel.setAttribute('data-tui-carousel-initialized', 'true');
        const index = parseInt(carousel.dataset.tuiCarouselCurrent || '0');
        updateCarousel(carousel, index);
      }
      
      // Handle autoplay if enabled
      if (carousel.dataset.tuiCarouselAutoplay === 'true') {
        if (entry.isIntersecting) {
          startAutoplay(carousel);
        } else {
          stopAutoplay(carousel);
        }
      }
    });
  });
  
  // Observe all carousels for visibility and initialization
  function observeCarousels() {
    document.querySelectorAll('[data-tui-carousel]').forEach(carousel => {
      if (!observedCarousels.has(carousel)) {
        observedCarousels.add(carousel);
        carouselObserver.observe(carousel);
      }
    });
  }
  
  // Start observing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeCarousels);
  } else {
    observeCarousels();
  }
  
  // Watch for dynamically added carousels
  new MutationObserver(observeCarousels).observe(document.body, {
    childList: true,
    subtree: true
  });
})();