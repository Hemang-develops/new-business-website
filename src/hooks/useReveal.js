import { useEffect, useRef, useState } from 'react';

// simple intersection observer hook that returns a ref and a boolean indicating
// whether the element has scrolled into view. once the element becomes visible
// we disconnect the observer so the animation only runs once.
export function useReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      options
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return [ref, visible];
}
