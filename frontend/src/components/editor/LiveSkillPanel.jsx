import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Cpu,
  CheckCircle,
  Zap,
  TrendingUp,
  BrainCircuit,
  Compass,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

import ScoreDial from './ScoreDial';
import MistakeTracker from './MistakeTracker';
import AITipCard from './AITipCard';

export const LiveSkillPanel = ({
  scores = {},
  mistakes = [],
  aiTips = [],
  recommendations = [],
  summary = '',
  isAnalyzing = false,
  language = 'python',
}) => {
  const overall = scores.overall || 0;
  const syntax = scores.syntax || 0;
  const quality = scores.quality || 0;
  const problemSolving = scores.problem_solving || 0;
  const efficiency = scores.efficiency || 0;
  const codingLevel = scores.coding_level || 'Beginner';

  const getLevelBadge = (lvl) => {
    switch (lvl) {
      case 'Expert':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/10';
      case 'Advanced':
        return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/40 shadow-purple-500/10';
      case 'Intermediate':
        return 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10';
      default:
        return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/80 border-l border-slate-800/80 backdrop-blur-xl overflow-y-auto custom-scrollbar select-none">
      {/* Header with live pulse status */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BrainCircuit className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live AI Skill Coach
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAnalyzing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span className="text-[10px] text-slate-400 font-mono">
                {isAnalyzing ? 'Analyzing typing stream...' : 'Live Stream Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Coding Level Badge */}
        <div
          className={`px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1 ${getLevelBadge(
            codingLevel
          )}`}
        >
          <Sparkles className="w-3 h-3" />
          {codingLevel}
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Main Circular Score Dial */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-cyber-box flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <ScoreDial
            score={overall}
            size={120}
            strokeWidth={10}
            label="Overall Coding Score"
            subtext={codingLevel}
            color="#06b6d4"
            glowColor="rgba(6, 182, 212, 0.5)"
          />

          {summary && (
            <p className="text-[11px] text-slate-300 text-center mt-3 max-w-[240px] italic leading-relaxed">
              "{summary}"
            </p>
          )}
        </div>

        {/* 4 Dimension Dials (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Syntax Proficiency */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center">
            <ScoreDial
              score={syntax}
              size={76}
              strokeWidth={7}
              label="Syntax Skill"
              color="#10b981"
              glowColor="rgba(16, 185, 129, 0.4)"
            />
            <span className="text-[10px] text-slate-500 mt-1 font-mono">Weight: 25%</span>
          </div>

          {/* Code Quality */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center">
            <ScoreDial
              score={quality}
              size={76}
              strokeWidth={7}
              label="Code Quality"
              color="#38bdf8"
              glowColor="rgba(56, 189, 248, 0.4)"
            />
            <span className="text-[10px] text-slate-500 mt-1 font-mono">Weight: 20%</span>
          </div>

          {/* Problem-Solving Ability */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center">
            <ScoreDial
              score={problemSolving}
              size={76}
              strokeWidth={7}
              label="Problem-Solving"
              color="#a855f7"
              glowColor="rgba(168, 85, 247, 0.4)"
            />
            <span className="text-[10px] text-slate-500 mt-1 font-mono">Weight: 30%</span>
          </div>

          {/* Code Efficiency */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-col items-center">
            <ScoreDial
              score={efficiency}
              size={76}
              strokeWidth={7}
              label="Efficiency"
              color="#f59e0b"
              glowColor="rgba(245, 158, 11, 0.4)"
            />
            <span className="text-[10px] text-slate-500 mt-1 font-mono">Weight: 15%</span>
          </div>
        </div>

        {/* Live Mistake Tracker Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              Real-Time Mistake Log
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {mistakes.length} detected
            </span>
          </div>
          <MistakeTracker mistakes={mistakes} />
        </div>

        {/* AI Mentor Tips */}
        {aiTips && aiTips.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              AI Mentor Guidance
            </span>
            <div className="space-y-2">
              {aiTips.map((tip, idx) => (
                <AITipCard key={idx} tip={tip} />
              ))}
            </div>
          </div>
        )}

        {/* Personalized Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-900/50 border border-purple-500/20 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              Recommended Next Steps
            </span>
            <ul className="space-y-1.5">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSkillPanel;
