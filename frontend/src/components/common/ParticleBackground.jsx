import { useEffect, useRef } from 'react';

export function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const rand = (min, max) => Math.random() * (max - min) + min;

    const createParticle = () => ({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.25, 0.25),
      radius: rand(1.0, 2.0),
      opacity: rand(0.08, 0.18),
      opacityDir: Math.random() > 0.5 ? 1 : -1,
      color: Math.random() > 0.4 ? '16, 185, 129' : '52, 211, 153',
    });

    const initParticles = () => {
      particles = Array.from({ length: 60 }, createParticle);
    };

    const drawParticle = (p) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
      ctx.fill();
      ctx.restore();
    };

    const drawLink = (a, b, dist) => {
      const alpha = (1 - dist / 160) * 0.07;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.fillStyle = '#060d07';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Very subtle ambient glow — nearly invisible
      const g1 = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.3, 20, canvas.width * 0.2, canvas.height * 0.3, 380);
      g1.addColorStop(0, 'rgba(5, 150, 105, 0.04)');
      g1.addColorStop(1, 'rgba(6, 13, 7, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const g2 = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.7, 30, canvas.width * 0.8, canvas.height * 0.7, 450);
      g2.addColorStop(0, 'rgba(16, 185, 129, 0.03)');
      g2.addColorStop(1, 'rgba(6, 13, 7, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Opacity pulse
        p.opacity += p.opacityDir * 0.002;
        if (p.opacity >= 0.18) p.opacityDir = -1;
        if (p.opacity <= 0.08) p.opacityDir = 1;

        drawParticle(p);

        // Draw links to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) drawLink(p, q, dist);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    resize();
    initParticles();
    tick();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
