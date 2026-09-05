import React from 'react';
import { motion } from 'framer-motion';

export const ScoreDial = ({
  score = 0,
  max = 100,
  size = 110,
  strokeWidth = 9,
  label = 'Score',
  color = '#06b6d4', // cyan default
  glowColor = 'rgba(6, 182, 212, 0.4)',
  subtext = '',
  showPercent = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(max, score || 0));
  const strokeDashoffset = circumference - (safeScore / max) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative group">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg] overflow-visible">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated score indicator */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.span
            key={safeScore}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xl font-bold font-mono tracking-tight text-white drop-shadow-sm"
          >
            {Math.round(safeScore)}
            {showPercent && <span className="text-xs text-slate-400 font-normal">/{max}</span>}
          </motion.span>
          {subtext && (
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              {subtext}
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-xs font-semibold text-slate-300 mt-2 text-center tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
};

export default ScoreDial;
