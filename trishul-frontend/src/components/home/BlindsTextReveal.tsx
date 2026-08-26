import React from 'react';
import { motion } from 'framer-motion';

export function BlindsTextReveal({ text }: { text: string }) {
  // Split text into lines or words for individual animation, or just animate a set of "blinds" covering the text
  return (
    <div className="relative inline-block overflow-hidden">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
        className="font-trishul text-6xl md:text-8xl font-bold tracking-tight text-[#00AFD7] pb-2 drop-shadow-lg"
      >
        {text}
      </motion.div>
      {/* Blinds effect overlays */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-background origin-top"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.1 + i * 0.05,
              ease: [0.76, 0, 0.24, 1]
            }}
          />
        ))}
      </div>
    </div>
  );
}
