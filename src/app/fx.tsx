'use client';

import { useEffect } from 'react';

// Below-the-fold elements that fade in as they enter the viewport.
const REVEAL =
  '.section-block:not(.qa-section) > *, .contact-section > *, .repo-card, .skill-row, .timeline-item, .insight-row, .credential-list li, .education-card';

// Scroll reveal, scroll progress, and a cursor glow; all skipped for reduced motion.
export function Fx() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    root.classList.add('fx');

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      const index = el.parentElement
        ? [...el.parentElement.children].indexOf(el)
        : 0;
      el.style.setProperty('--d', String(Math.min(index, 6)));
      el.classList.add('reveal');
      io.observe(el);
    });

    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.append(bar);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = root.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    let glow: HTMLDivElement | null = null;
    const onMove = (e: PointerEvent) => {
      if (glow)
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    if (window.matchMedia('(pointer: fine)').matches) {
      glow = document.createElement('div');
      glow.className = 'cursor-glow';
      document.body.append(glow);
      window.addEventListener('pointermove', onMove, { passive: true });
    }

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
      bar.remove();
      glow?.remove();
      root.classList.remove('fx');
      document
        .querySelectorAll('.reveal')
        .forEach((el) => el.classList.remove('reveal', 'in'));
    };
  }, []);

  return null;
}
