"use client";

import { motion } from "framer-motion";

export function BackgroundGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                           linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)'
        }}
      />

      {/* Animated Beams */}
      <div className="absolute inset-0">
        <AnimatedBeam delay={0} duration={8} />
        <AnimatedBeam delay={4} duration={10} style={{ left: '20%' }} />
        <AnimatedBeam delay={2} duration={7} style={{ left: '80%' }} />
      </div>
    </div>
  );
}

function AnimatedBeam({ delay, duration, style }: { delay: number; duration: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute top-0 w-[1px] h-[40vh] bg-gradient-to-b from-transparent via-primary/50 to-transparent"
      style={style}
      initial={{ y: '-100%', opacity: 0 }}
      animate={{ y: '100vh', opacity: [0, 1, 0] }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }}
    />
  );
}
