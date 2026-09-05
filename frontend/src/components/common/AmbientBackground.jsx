import React, { useEffect, useRef } from 'react';

/**
 * AmbientBackground - A living, interactive constellation & nebula background.
 * Uses an HTML5 Canvas for floating glowing connected nodes + CSS for ambient aurora orbs.
 */
const AmbientBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes configuration
    const nodeCount = Math.min(Math.floor((width * height) / 18000), 75);
    const colors = [
      'rgba(99, 102, 241, ',   // Brand Indigo
      'rgba(6, 182, 212, ',    // Cyan
      'rgba(168, 85, 247, ',   // Violet
      'rgba(56, 189, 248, ',   // Sky Blue
    ];

    const particles = [];
    for (let i = 0; i < nodeCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2 + 1.2,
        colorPrefix: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.5 + 0.3,
      });
    }

    const maxDistance = 130;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw particle dot with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${p.baseAlpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `${p.colorPrefix}0.8)`;
        ctx.fill();

        // Connect nearby particles with glowing lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.28;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${p.colorPrefix}${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#070a14]"
    >
      {/* 1. Rich Glowing Ambient Aurora Orbs */}
      <div className="absolute -top-[10%] left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-brand-600/35 via-indigo-600/25 to-transparent blur-[110px] animate-orb-1" />
      <div className="absolute top-[25%] -right-[8%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-cyan-500/30 via-blue-600/20 to-transparent blur-[100px] animate-orb-2" />
      <div className="absolute -bottom-[10%] left-[20%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-purple-600/30 via-brand-600/20 to-transparent blur-[120px] animate-orb-3" />

      {/* 2. Cyber Dev Grid Pattern Layer */}
      <div className="absolute inset-0 bg-grid-pattern opacity-80 [mask-image:radial-gradient(ellipse_90%_70%_at_50%_45%,#000_40%,transparent_100%)]" />

      {/* 3. HTML5 Canvas with Animated Floating Particle Constellation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-75"
      />

      {/* 4. Top subtle glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
    </div>
  );
};

export default AmbientBackground;
