(function () {
  function initStepper(container) {
    if (container.hasAttribute("data-initialized")) return;

    container.setAttribute("data-initialized", "true");

    const stepperId = container.dataset.stepperId;
    if (!stepperId) return;

    const orientation = container.dataset.orientation || "horizontal";
    const steps = Array.from(
      container.querySelectorAll(`[data-step][data-stepper-id="${stepperId}"]`)
    );
    const stepContents = Array.from(
      container.querySelectorAll(
        `[data-step-content][data-stepper-id="${stepperId}"]`
      )
    );
    
    let currentStep = parseInt(container.dataset.currentStep) || 1;

    function updateStepStates() {
      for (const step of steps) {
        const stepNumber = parseInt(step.dataset.stepNumber);
        const trigger = step.querySelector("[data-step-trigger]");
        const connector = step.querySelector("[data-step-connector] > div");
        
        let status;
        if (stepNumber < currentStep) {
          status = "completed";
        } else if (stepNumber === currentStep) {
          status = "active";
        } else {
          status = "incomplete";
        }
        
        step.dataset.status = status;
        
        // Update trigger classes
        if (trigger) {
          trigger.classList.remove(
            "bg-primary", "bg-muted", "bg-destructive",
            "text-primary-foreground", "text-muted-foreground", "text-destructive-foreground"
          );
          
          switch (status) {
            case "active":
            case "completed":
              trigger.classList.add("bg-primary", "text-primary-foreground");
              break;
            case "error":
              trigger.classList.add("bg-destructive", "text-destructive-foreground");
              break;
            default:
              trigger.classList.add("bg-muted", "text-muted-foreground");
          }
          
          trigger.setAttribute("aria-current", status === "active" ? "step" : "false");
          
          // Update icon/number
          const svg = trigger.querySelector("svg");
          const span = trigger.querySelector("span");
          
          if (status === "completed") {
            if (span) span.style.display = "none";
            if (!svg) {
              const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
              newSvg.setAttribute("class", trigger.classList.contains("w-8") ? "w-4 h-4" : 
                                           trigger.classList.contains("w-12") ? "w-6 h-6" : "w-5 h-5");
              newSvg.setAttribute("fill", "none");
              newSvg.setAttribute("viewBox", "0 0 24 24");
              newSvg.setAttribute("stroke", "currentColor");
              newSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
              trigger.appendChild(newSvg);
            } else {
              svg.style.display = "block";
            }
          } else {
            if (svg) svg.style.display = "none";
            if (span) {
              span.style.display = "block";
              span.textContent = stepNumber;
            } else {
              const newSpan = document.createElement("span");
              newSpan.className = trigger.classList.contains("w-8") ? "text-xs" : 
                                 trigger.classList.contains("w-12") ? "text-lg" : "text-sm";
              newSpan.textContent = stepNumber;
              trigger.appendChild(newSpan);
            }
          }
        }
        
        // Update connector
        if (connector) {
          connector.classList.remove("bg-primary", "bg-muted");
          connector.classList.add(status === "completed" ? "bg-primary" : "bg-muted");
        }
      }
      
      // Update content visibility
      for (const content of stepContents) {
        const contentNumber = parseInt(content.dataset.stepNumber);
        const isActive = contentNumber === currentStep;
        content.style.display = isActive ? "block" : "none";
      }
      
      // Update container's current step
      container.dataset.currentStep = currentStep.toString();
      
      // Dispatch custom event
      container.dispatchEvent(new CustomEvent("stepper:change", {
        detail: { currentStep, stepperId }
      }));
    }

    function goToStep(stepNumber) {
      stepNumber = parseInt(stepNumber);
      if (stepNumber < 1 || stepNumber > steps.length) return;
      
      currentStep = stepNumber;
      updateStepStates();
    }

    function nextStep() {
      if (currentStep < steps.length) {
        goToStep(currentStep + 1);
      }
    }

    function prevStep() {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    }

    // Click handlers for step triggers
    for (const step of steps) {
      const trigger = step.querySelector("[data-step-trigger]");
      if (trigger) {
        trigger.addEventListener("click", () => {
          const stepNumber = parseInt(step.dataset.stepNumber);
          goToStep(stepNumber);
        });
      }
    }

    // Keyboard navigation
    container.addEventListener("keydown", (e) => {
      if (e.target.matches("[data-step-trigger]")) {
        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            nextStep();
            break;
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            prevStep();
            break;
          case "Home":
            e.preventDefault();
            goToStep(1);
            break;
          case "End":
            e.preventDefault();
            goToStep(steps.length);
            break;
        }
      }
    });

    // Listen for navigation events
    container.addEventListener("stepper:navigate", (e) => {
      goToStep(e.detail.step);
    });

    // Initial state
    updateStepStates();
  }

  function init(root = document) {
    if (root instanceof Element && root.matches("[data-stepper]")) {
      initStepper(root);
    }
    for (const stepper of root.querySelectorAll(
      "[data-stepper]:not([data-initialized])"
    )) {
      initStepper(stepper);
    }
  }

  // Event delegation for navigation triggers
  document.addEventListener("click", (e) => {
    // Handle Next button
    const nextButton = e.target.closest("[data-stepper-next]");
    if (nextButton) {
      e.preventDefault();
      const stepperId = nextButton.dataset.stepperNext;
      let stepper;
      
      if (stepperId) {
        stepper = document.getElementById(stepperId);
      } else {
        stepper = nextButton.closest("[data-stepper]");
      }
      
      if (stepper && stepper.hasAttribute("data-initialized")) {
        const currentStep = parseInt(stepper.dataset.currentStep) || 1;
        const steps = stepper.querySelectorAll("[data-step]");
        if (currentStep < steps.length) {
          const event = new CustomEvent("stepper:navigate", {
            detail: { step: currentStep + 1, stepperId: stepper.dataset.stepperId }
          });
          stepper.dispatchEvent(event);
        }
      }
    }
    
    // Handle Prev button
    const prevButton = e.target.closest("[data-stepper-prev]");
    if (prevButton) {
      e.preventDefault();
      const stepperId = prevButton.dataset.stepperPrev;
      let stepper;
      
      if (stepperId) {
        stepper = document.getElementById(stepperId);
      } else {
        stepper = prevButton.closest("[data-stepper]");
      }
      
      if (stepper && stepper.hasAttribute("data-initialized")) {
        const currentStep = parseInt(stepper.dataset.currentStep) || 1;
        if (currentStep > 1) {
          const event = new CustomEvent("stepper:navigate", {
            detail: { step: currentStep - 1, stepperId: stepper.dataset.stepperId }
          });
          stepper.dispatchEvent(event);
        }
      }
    }
    
    // Handle GoTo button
    const gotoButton = e.target.closest("[data-stepper-goto]");
    if (gotoButton) {
      e.preventDefault();
      const stepperId = gotoButton.dataset.stepperGoto;
      const targetStep = parseInt(gotoButton.dataset.stepperGotoStep);
      let stepper;
      
      if (stepperId) {
        stepper = document.getElementById(stepperId);
      } else {
        stepper = gotoButton.closest("[data-stepper]");
      }
      
      if (stepper && stepper.hasAttribute("data-initialized") && targetStep) {
        const steps = stepper.querySelectorAll("[data-step]");
        if (targetStep >= 1 && targetStep <= steps.length) {
          const event = new CustomEvent("stepper:navigate", {
            detail: { step: targetStep, stepperId: stepper.dataset.stepperId }
          });
          stepper.dispatchEvent(event);
        }
      }
    }
  });

  window.templUI = window.templUI || {};
  window.templUI.stepper = { init: init };

  document.addEventListener("DOMContentLoaded", () => init());
})();