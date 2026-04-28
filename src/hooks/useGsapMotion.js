import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const getScopedElements = (scopeRef, selector) => {
  const scope = scopeRef?.current;
  if (!scope) return [];

  const elements = Array.from(scope.querySelectorAll(selector));
  if (scope.matches?.(selector)) {
    elements.unshift(scope);
  }

  return elements;
};

export const useGsapReveal = (scopeRef, dependencies = [], selector = "[data-gsap-reveal]") => {
  useGSAP(
    () => {
      const elements = getScopedElements(scopeRef, selector);
      if (!elements.length) return;

      if (prefersReducedMotion()) {
        gsap.set(elements, { clearProps: "all" });
        return;
      }

      elements.forEach((element, index) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 36 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            delay: Number(element.dataset.gsapDelay || 0) || (index % 4) * 0.06,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 88%",
              once: true,
            },
          },
        );
      });
    },
    { dependencies },
  );
};

export const useGsapPulse = (scopeRef, selector = "[data-gsap-pulse]", dependencies = []) => {
  useGSAP(
    () => {
      const elements = getScopedElements(scopeRef, selector);
      if (!elements.length) return;
      if (prefersReducedMotion()) return;

      elements.forEach((element, index) => {
        gsap.to(element, {
          autoAlpha: 0.45,
          scale: 0.94,
          duration: 1.1 + index * 0.08,
          delay: Number(element.dataset.gsapDelay || 0) || index * 0.18,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    },
    { dependencies },
  );
};

export const useGsapSpin = (scopeRef, selector = "[data-gsap-spin]", dependencies = []) => {
  useGSAP(
    () => {
      const elements = getScopedElements(scopeRef, selector);
      if (!elements.length) return;
      if (prefersReducedMotion()) return;

      gsap.to(elements, {
        rotate: 360,
        duration: 0.9,
        repeat: -1,
        ease: "none",
      });
    },
    { dependencies },
  );
};

export const useGsapHover = (scopeRef, selector = "[data-gsap-hover]", dependencies = []) => {
  useGSAP(
    () => {
      const elements = getScopedElements(scopeRef, selector);
      if (!elements.length) return;
      if (prefersReducedMotion()) return;

      const cleanups = elements.map((element) => {
        const enter = () => {
          gsap.to(element, {
            y: -6,
            scale: 1.01,
            duration: 0.28,
            ease: "power2.out",
          });
        };
        const leave = () => {
          gsap.to(element, {
            y: 0,
            scale: 1,
            duration: 0.34,
            ease: "power2.out",
          });
        };

        element.addEventListener("mouseenter", enter);
        element.addEventListener("mouseleave", leave);
        element.addEventListener("focus", enter);
        element.addEventListener("blur", leave);

        return () => {
          element.removeEventListener("mouseenter", enter);
          element.removeEventListener("mouseleave", leave);
          element.removeEventListener("focus", enter);
          element.removeEventListener("blur", leave);
        };
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    },
    { dependencies },
  );
};
