import React from 'react';

export const BackgroundCanvas = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.5) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating Ambient Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[140px] pulse-glow-bg" />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-emerald-500/10 dark:bg-emerald-600/15 blur-[140px] pulse-glow-bg" 
        style={{ animationDelay: '4s' }} 
      />
      <div 
        className="absolute top-[40%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-violet-500/5 dark:bg-violet-600/10 blur-[130px] pulse-glow-bg" 
        style={{ animationDelay: '2s' }} 
      />
    </div>
  );
};

export default BackgroundCanvas;
