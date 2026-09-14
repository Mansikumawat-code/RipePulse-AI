import { useEffect, useRef } from 'react';

const PRODUCE_ASSETS = [
  '/images/avocado.png',
  '/images/strawberries.png',
  '/images/broccoli.png',
  '/images/lemon.png',
  '/images/bell_pepper.png',
  '/images/cabbage.png',
  '/images/snow_beans.png',
  '/images/beets.png',
];

const TOTAL_ITEMS = 12;

export function FloatingProduce({ isStable = false, theme = 'dark' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId;

    const generatePositions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 12 sectors: 4 columns x 3 rows grid with random offsets for natural organic distribution
      const cols = 4;
      const rows = 3;
      const cellW = width / cols;
      const cellH = height / rows;

      return Array.from({ length: TOTAL_ITEMS }, (_, i) => {
        const src = PRODUCE_ASSETS[i % PRODUCE_ASSETS.length];
        const size = Math.floor(Math.random() * 40) + 70; // 70px to 110px

        const col = i % cols;
        const row = Math.floor(i / cols);

        // Position within the sector with organic random jitter
        const padding = 16;
        const minX = col * cellW + padding;
        const maxX = (col + 1) * cellW - size - padding;
        const minY = row * cellH + padding;
        const maxY = (row + 1) * cellH - size - padding;

        const x = Math.max(padding, minX + Math.random() * Math.max(10, maxX - minX));
        const y = Math.max(padding, minY + Math.random() * Math.max(10, maxY - minY));

        const speed = 0.4 + Math.random() * 0.5;
        const angle = Math.random() * Math.PI * 2;

        return {
          src,
          size,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.floor(Math.random() * 60) - 30, // -30deg to +30deg natural slant
          vRot: (Math.random() - 0.5) * 0.45,
          opacity: 0.06 + Math.random() * 0.06,
          el: null,
        };
      });
    };

    const items = generatePositions();

    // Render DOM elements directly
    container.innerHTML = '';
    items.forEach((item) => {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = '';
      img.style.position = 'absolute';
      img.style.width = `${item.size}px`;
      img.style.height = `${item.size}px`;
      img.style.objectFit = 'contain';
      img.style.opacity = theme === 'dark' ? `${item.opacity}` : `${item.opacity * 0.8}`;
      img.style.filter = theme === 'dark'
        ? 'saturate(0.8) contrast(1.0) drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
        : 'saturate(1.0) contrast(1.0) drop-shadow(0 4px 8px rgba(0,0,0,0.1))';
      img.style.willChange = isStable ? 'auto' : 'transform';
      img.style.pointerEvents = 'none';
      img.style.transform = `translate3d(${item.x.toFixed(1)}px, ${item.y.toFixed(1)}px, 0) rotate(${item.rot}deg)`;
      container.appendChild(img);
      item.el = img;
    });

    // If stable mode is requested (e.g. on all dashboard pages), DO NOT run movement loop!
    if (isStable) {
      const handleResize = () => {
        const recomputed = generatePositions();
        recomputed.forEach((newItem, idx) => {
          if (items[idx]?.el) {
            items[idx].el.style.transform = `translate3d(${newItem.x.toFixed(1)}px, ${newItem.y.toFixed(1)}px, 0) rotate(${newItem.rot}deg)`;
          }
        });
      };
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (container) container.innerHTML = '';
      };
    }

    // Dynamic random physics drift mode (used on Login page)
    let lastTime = performance.now();

    const update = (time) => {
      const dt = Math.min((time - lastTime) / 16.667, 2.5);
      lastTime = time;

      const curW = window.innerWidth;
      const curH = window.innerHeight;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        item.vx += (Math.random() - 0.5) * 0.02 * dt;
        item.vy += (Math.random() - 0.5) * 0.02 * dt;

        const currentSpeed = Math.sqrt(item.vx * item.vx + item.vy * item.vy);
        if (currentSpeed > 1.1) {
          item.vx = (item.vx / currentSpeed) * 1.1;
          item.vy = (item.vy / currentSpeed) * 1.1;
        } else if (currentSpeed < 0.25) {
          item.vx = (item.vx / (currentSpeed || 1)) * 0.35;
          item.vy = (item.vy / (currentSpeed || 1)) * 0.35;
        }

        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.rot += item.vRot * dt;

        const pad = 12;
        if (item.x < pad) {
          item.x = pad;
          item.vx = Math.abs(item.vx) * 0.95;
        } else if (item.x > curW - item.size - pad) {
          item.x = curW - item.size - pad;
          item.vx = -Math.abs(item.vx) * 0.95;
        }

        if (item.y < pad) {
          item.y = pad;
          item.vy = Math.abs(item.vy) * 0.95;
        } else if (item.y > curH - item.size - pad) {
          item.y = curH - item.size - pad;
          item.vy = -Math.abs(item.vy) * 0.95;
        }

        if (item.el) {
          item.el.style.transform = `translate3d(${item.x.toFixed(1)}px, ${item.y.toFixed(1)}px, 0) rotate(${item.rot.toFixed(1)}deg)`;
        }
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      if (container) container.innerHTML = '';
    };
  }, [isStable, theme]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    />
  );
}
