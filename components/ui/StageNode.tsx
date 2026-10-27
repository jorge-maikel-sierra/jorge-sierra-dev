"use client";

import { useEffect, useRef } from "react";

// The node of the stage rail (globals.css .stage-node): lit while its section
// crosses the middle of the viewport.
export function StageNode() {
  const node = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = node.current;
    const section = element?.closest("section");
    if (!element || !section) return;
    const observer = new IntersectionObserver(
      ([entry]) => element.toggleAttribute("data-active", entry.isIntersecting),
      { rootMargin: "-50% 0px -50% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return <span ref={node} aria-hidden="true" className="stage-node" />;
}
