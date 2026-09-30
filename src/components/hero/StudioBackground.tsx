import React from 'react';

export const StudioBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#05070e]">
      {/* 1. Subtle High-Tech Dot Matrix Grid (Industry Standard SaaS Pattern) */}
      <div 
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* 2. Top Ambient Horizon Glow (Amber / Emerald subtle gradients) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      {/* 3. Subtle Corner Atmospheric Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* 4. Fine Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#03050a] via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
