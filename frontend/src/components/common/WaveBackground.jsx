import React, { useEffect, useRef } from 'react';

export function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let step = 0;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Harmonic wave parameters
    const waves = [
      {
        baseYRatio: 0.62,
        amplitude: 35,
        wavelength: 0.0035,
        speed: 0.012,
        colorStart: 'rgba(215, 188, 150, 0.06)',
        colorEnd: 'rgba(232, 220, 200, 0.0)',
        strokeColor: 'rgba(195, 160, 115, 0.08)',
        strokeWidth: 1,
      },
      {
        baseYRatio: 0.72,
        amplitude: 28,
        wavelength: 0.0048,
        speed: -0.016,
        colorStart: 'rgba(200, 165, 125, 0.05)',
        colorEnd: 'rgba(232, 220, 200, 0.0)',
        strokeColor: 'rgba(180, 140, 95, 0.08)',
        strokeWidth: 1,
      },
      {
        baseYRatio: 0.82,
        amplitude: 22,
        wavelength: 0.006,
        speed: 0.02,
        colorStart: 'rgba(16, 185, 129, 0.05)',
        colorEnd: 'rgba(52, 211, 153, 0.0)',
        strokeColor: 'rgba(16, 185, 129, 0.10)',
        strokeWidth: 1,
      },
      {
        baseYRatio: 0.90,
        amplitude: 18,
        wavelength: 0.0075,
        speed: -0.024,
        colorStart: 'rgba(225, 29, 72, 0.03)',
        colorEnd: 'rgba(232, 220, 200, 0.0)',
        strokeColor: 'rgba(244, 63, 94, 0.07)',
        strokeWidth: 1,
      }
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      waves.forEach((w, waveIdx) => {
        const baseY = height * w.baseYRatio;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, baseY);

        // Smooth wave path across screen width
        for (let x = 0; x <= width; x += 6) {
          const y =
            baseY +
            Math.sin(x * w.wavelength + step * w.speed + waveIdx) * w.amplitude +
            Math.cos(x * w.wavelength * 0.5 + step * w.speed * 0.7) * (w.amplitude * 0.35);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Gradient wash
        const grad = ctx.createLinearGradient(0, baseY - w.amplitude, 0, height);
        grad.addColorStop(0, w.colorStart);
        grad.addColorStop(1, w.colorEnd);
        ctx.fillStyle = grad;
        ctx.fill();

        // Wave crest line stroke
        ctx.beginPath();
        for (let x = 0; x <= width; x += 6) {
          const y =
            baseY +
            Math.sin(x * w.wavelength + step * w.speed + waveIdx) * w.amplitude +
            Math.cos(x * w.wavelength * 0.5 + step * w.speed * 0.7) * (w.amplitude * 0.35);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = w.strokeColor;
        ctx.lineWidth = w.strokeWidth;
        ctx.stroke();

        ctx.restore();
      });

      step += 1;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    />
  );
}
