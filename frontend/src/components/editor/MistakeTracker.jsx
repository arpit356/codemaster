import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, Sparkles, Flame } from 'lucide-react';

export const MistakeTracker = ({ mistakes = [] }) => {
  if (!mistakes || mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm">
        <Sparkles className="w-8 h-8 text-emerald-400 mb-2 opacity-80" />
        <p className="text-xs font-semibold text-emerald-300">Clean Code Stream</p>
        <p className="text-[11px] text-slate-400 mt-0.5">No critical syntax or structural defects detected.</p>
      </div>
    );
  }

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'error':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        };
      default:
        return {
          icon: <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
        };
    }
  };

  return (
    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
      <AnimatePresence>
        {mistakes.map((m, idx) => {
          const badge = getSeverityBadge(m.severity);
          return (
            <motion.div
              key={`${m.message}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all text-xs flex flex-col gap-1 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {badge.icon}
                  <span className="font-semibold text-slate-200 truncate">{m.message}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {m.line_number && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
                      L{m.line_number}
                    </span>
                  )}
                  {m.frequency > 1 && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                      <Flame className="w-2.5 h-2.5" />
                      ×{m.frequency}
                    </span>
                  )}
                </div>
              </div>

              {m.explanation && (
                <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                  {m.explanation}
                </p>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default MistakeTracker;
