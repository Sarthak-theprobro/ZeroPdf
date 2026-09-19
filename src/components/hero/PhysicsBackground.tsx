import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseAlpha: number;
  pulseSpeed: number;
}

export const PhysicsBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      normalizedX: 0,
      normalizedY: 0,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.normalizedX = (e.clientX / width - 0.5) * 2;
      mouse.normalizedY = (e.clientY / height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 1. Initialize 3D Starfield
    const STAR_COUNT = 130;
    let stars: Star[] = [];

    const initStars = () => {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.75, // Upper 75% for celestial field
          z: Math.random() * 2 + 0.5,
          size: Math.random() * 1.5 + 0.5,
          baseAlpha: Math.random() * 0.4 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    initStars();

    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth cursor parallax tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // A. Deep Void Obsidian Canvas
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, width, height);

      // B. Volumetric Cosmic Nebula Clusters
      // 1. Top Solar Plasma Ambient Core
      const nebula1 = ctx.createRadialGradient(
        width * 0.5 + mouse.normalizedX * 40,
        height * 0.15 + mouse.normalizedY * 30,
        0,
        width * 0.5,
        height * 0.15,
        width * 0.6
      );
      nebula1.addColorStop(0, 'rgba(245, 158, 11, 0.08)'); // Solar Amber
      nebula1.addColorStop(0.4, 'rgba(16, 185, 129, 0.03)'); // Sovereign Emerald
      nebula1.addColorStop(0.8, 'rgba(99, 102, 241, 0.02)'); // Deep Indigo
      nebula1.addColorStop(1, 'rgba(5, 7, 12, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      // 2. Secondary Interactive Cursor Light Plasma
      const cursorPlasma = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        320
      );
      cursorPlasma.addColorStop(0, 'rgba(251, 191, 36, 0.06)'); // Radiant Gold
      cursorPlasma.addColorStop(0.5, 'rgba(16, 185, 129, 0.025)'); // Laser Emerald
      cursorPlasma.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cursorPlasma;
      ctx.fillRect(mouse.x - 320, mouse.y - 320, 640, 640);

      // C. 3D Celestial Starfield with Parallax
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const parallaxX = star.x - mouse.normalizedX * (star.z * 15);
        const parallaxY = star.y - mouse.normalizedY * (star.z * 10);
        const alpha = star.baseAlpha + Math.sin(time * 2 + i) * 0.15;

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, alpha)})`;
        ctx.beginPath();
        ctx.arc(parallaxX, parallaxY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle specular cross-flare on brighter foreground stars
        if (star.z > 2.0 && alpha > 0.4) {
          ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(parallaxX - 4, parallaxY);
          ctx.lineTo(parallaxX + 4, parallaxY);
          ctx.moveTo(parallaxX, parallaxY - 4);
          ctx.lineTo(parallaxX, parallaxY + 4);
          ctx.stroke();
        }
      }

      // D. Perspective Quantum Horizon Grid (Lower Horizon)
      const horizonY = height * 0.65;
      const perspectiveLines = 18;
      const horizonSpan = width * 1.6;

      ctx.save();
      ctx.lineWidth = 1;

      // Horizon Radial Glow
      const horizonGlow = ctx.createRadialGradient(
        width / 2,
        horizonY,
        0,
        width / 2,
        horizonY,
        width * 0.5
      );
      horizonGlow.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
      horizonGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.04)');
      horizonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, horizonY - 120, width, height - horizonY + 120);

      // Perspective Rays radiating from Horizon Vanishing Point
      const vanishingX = width / 2 + mouse.normalizedX * 60;
      for (let i = 0; i <= perspectiveLines; i++) {
        const bottomX = (i / perspectiveLines - 0.5) * horizonSpan + width / 2;
        const distFromCenter = Math.abs(i / perspectiveLines - 0.5);
        const rayAlpha = (1 - distFromCenter * 1.4) * 0.12;

        if (rayAlpha > 0.01) {
          ctx.strokeStyle = `rgba(245, 158, 11, ${rayAlpha})`;
          ctx.beginPath();
          ctx.moveTo(vanishingX, horizonY);
          ctx.lineTo(bottomX, height);
          ctx.stroke();
        }
      }

      // Horizontal Undulating Depth Grid Lines
      const horizontalRungs = 12;
      for (let j = 1; j <= horizontalRungs; j++) {
        // Perspective spacing compression
        const progress = Math.pow(j / horizontalRungs, 2.2);
        const y = horizonY + progress * (height - horizonY);
        
        // Gentle wave motion across time
        const wave = Math.sin(time + j * 0.5) * 2;
        const lineAlpha = progress * 0.15;

        ctx.strokeStyle = `rgba(16, 185, 129, ${lineAlpha})`;
        ctx.beginPath();
        ctx.moveTo(0, y + wave);
        ctx.lineTo(width, y + wave);
        ctx.stroke();
      }

      ctx.restore();

      // E. Soft Cinematic Vignette
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.4,
        width / 2,
        height / 2,
        width * 0.8
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(5, 7, 12, 0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};