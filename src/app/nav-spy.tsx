'use client';

import { useEffect } from 'react';

// Marks the rail link of the section in view; the hero stands in for "home".
export function NavSpy() {
  useEffect(() => {
    const links = [
      ...document.querySelectorAll<HTMLAnchorElement>('.rail-nav a'),
    ];
    const sections = links
      .map((a) => {
        const id = a.getAttribute('href')?.slice(1) ?? '';
        const el =
          id === 'home'
            ? document.querySelector('.hero')
            : document.getElementById(id);
        return el ? { id, el, a } : null;
      })
      .filter((s): s is NonNullable<typeof s> => !!s);

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (!hit) return;
        const current = sections.find((s) => s.el === hit.target);
        links.forEach((a) =>
          a.toggleAttribute('aria-current', a === current?.a),
        );
        if (current) current.a.setAttribute('aria-current', 'true');
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    sections.forEach((s) => observer.observe(s.el));
    return () => observer.disconnect();
  }, []);

  return null;
}
