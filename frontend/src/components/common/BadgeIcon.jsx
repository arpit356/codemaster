import React from 'react';
import { 
  Zap, 
  Layers, 
  Sparkles, 
  Flame, 
  Rocket, 
  Award, 
  CheckCircle2, 
  Lock,
  Trophy,
  Code
} from 'lucide-react';

const ICON_MAP = {
  Zap,
  Layers,
  Sparkles,
  Flame,
  Rocket,
  Award,
  Trophy,
  Code
};

export const BadgeIcon = ({ iconName, className = "w-6 h-6 text-brand-400" }) => {
  const IconComponent = ICON_MAP[iconName] || Award;
  return <IconComponent className={className} />;
};

export const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-400 animate-spin animation-direction-reverse" />
      </div>
      <p className="text-sm font-medium text-slate-400 animate-pulse">{text}</p>
    </div>
  );
};
