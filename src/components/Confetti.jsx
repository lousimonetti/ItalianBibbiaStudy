import { useEffect, useMemo, useState } from 'react';

// Lightweight, dependency-free tricolore confetti. Spawns a burst of falling
// pieces, then unmounts itself. Honors prefers-reduced-motion (renders nothing).
const COLORS = ['#008C45', '#c8c4ba', '#CE2B37']; // verde · bianco · rosso

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Confetti({ count = 36, duration = 1900 }) {
  const [on, setOn] = useState(true);

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 300,
        dur: 1200 + Math.random() * 800,
        rot: Math.floor(Math.random() * 360),
        color: COLORS[i % COLORS.length],
      })),
    [count]
  );

  useEffect(() => {
    const t = setTimeout(() => setOn(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  if (prefersReducedMotion || !on) return null;

  return (
    <div className="confetti-root" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.dur}ms`,
            '--rot': `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
