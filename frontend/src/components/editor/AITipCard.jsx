import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle2, AlertOctagon, TrendingUp } from 'lucide-react';

export const AITipCard = ({ tip }) => {
  if (!tip) return null;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'praise':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-950/20',
          badge: 'bg-emerald-500/20 text-emerald-300',
        };
      case 'warning':
        return {
          icon: <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />,
          border: 'border-rose-500/30',
          bg: 'bg-rose-950/20',
          badge: 'bg-rose-500/20 text-rose-300',
        };
      case 'recommendation':
        return {
          icon: <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />,
          border: 'border-purple-500/30',
          bg: 'bg-purple-950/20',
          badge: 'bg-purple-500/20 text-purple-300',
        };
      default:
        return {
          icon: <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0" />,
          border: 'border-cyan-500/30',
          bg: 'bg-cyan-950/20',
          badge: 'bg-cyan-500/20 text-cyan-300',
        };
    }
  };

  const style = getTypeStyle(tip.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-xl border ${style.border} ${style.bg} backdrop-blur-md flex flex-col gap-1.5 shadow-sm`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {style.icon}
          <span className="text-xs font-semibold text-slate-200">{tip.title}</span>
        </div>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${style.badge}`}>
          {tip.type || 'Tip'}
        </span>
      </div>
      <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
        {tip.body}
      </p>
    </motion.div>
  );
};

export default AITipCard;
