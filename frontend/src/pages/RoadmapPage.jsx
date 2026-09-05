import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assessmentAPI } from '../services/api';
import Roadmap3DSpace from '../components/3d/Roadmap3DSpace';
import { 
  Compass, 
  CheckCircle2, 
  Lock, 
  Play, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  BookOpen,
  Layers,
  ChevronRight,
  Globe2,
  ListFilter
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/BadgeIcon';

const RoadmapPage = () => {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'list'

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const res = await assessmentAPI.getRoadmap();
        setRoadmap(res.data);
      } catch (err) {
        console.error('Error loading roadmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  if (loading) return <LoadingSpinner text="Synthesizing 3D space pathway through algorithmic cosmos..." />;

  const getNodeStyles = (status) => {
    switch (status) {
      case 'completed':
        return {
          border: 'border-emerald-500/50 bg-emerald-500/10 shadow-glow-emerald',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          badgeText: 'Completed',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
        };
      case 'in_progress':
        return {
          border: 'border-cyan-500/60 bg-cyan-500/15 shadow-glow-cyan',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse',
          badgeText: 'Current Focus',
          icon: Play,
          iconColor: 'text-cyan-400',
        };
      case 'recommended_review':
        return {
          border: 'border-rose-500/50 bg-rose-500/10 shadow-glow-rose',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          badgeText: 'Remediation Review',
          icon: AlertTriangle,
          iconColor: 'text-rose-400',
        };
      default:
        return {
          border: 'border-dark-800 bg-dark-900/50 opacity-60',
          badge: 'bg-dark-800 text-slate-500 border-dark-700',
          badgeText: 'Locked',
          icon: Lock,
          iconColor: 'text-slate-500',
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl glass-panel-glow border border-cyan-500/30 shadow-cyber-box flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            Adaptive Celestial Pathway
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Personalized Learning Roadmap
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            A 3D pathway through space tracking your journey from Programming Basics to Advanced Dynamic Programming.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-dark-900/80 p-1.5 rounded-2xl border border-dark-700">
          <button
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === '3d'
                ? 'bg-cyan-500 text-dark-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>3D Cosmic Space</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-cyan-500 text-dark-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Milestone List</span>
          </button>
        </div>
      </div>

      {/* 3D Cosmic Space Pathway View */}
      {viewMode === '3d' ? (
        <div className="space-y-4">
          <Roadmap3DSpace userRoadmap={roadmap} />

          {/* Guide Legend */}
          <div className="p-4 rounded-2xl glass-panel border border-dark-700 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="w-4 h-4" />
              <span>Orbit controls: Click & drag to rotate view. Click any 3D node to open practice briefing.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Completed (Glowing)
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> Current Focus (Active Pulse)
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                <span className="w-2 h-2 rounded-full bg-slate-600" /> Locked (Dark Obsidian)
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed List View */
        <div className="space-y-6">
          {/* Progress Overview Bar */}
          {roadmap && (
            <div className="p-4 rounded-2xl bg-dark-900 border border-dark-700 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Learning Path Progress</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">{roadmap.completion_percentage || 0}%</span>
                  <span className="text-xs text-slate-400">Completed • {roadmap.current_level || 'Beginner'} Level</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-48 h-2.5 rounded-full bg-dark-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-brand-600 transition-all duration-700" style={{ width: `${roadmap.completion_percentage || 0}%` }} />
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold">{roadmap.completion_percentage || 0}%</span>
              </div>
            </div>
          )}

          {/* Milestone Cards */}
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[22px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-cyan-500/50 via-brand-500/30 to-slate-800/30" />

            <div className="space-y-4">
              {(roadmap?.nodes || roadmap?.steps || []).map((step, idx) => {
                const styles = getNodeStyles(step.status);
                const Icon = styles.icon;

                return (
                  <div key={idx} className="relative flex gap-4 group">
                    {/* Node Pin */}
                    <div className={`relative z-10 w-11 h-11 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105 ${styles.border} bg-dark-950 shadow-lg`}>
                      <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                    </div>

                    {/* Card */}
                    <div className={`flex-1 mb-2 p-5 rounded-2xl border glass-panel transition-all duration-200 ${styles.border} group-hover:shadow-lg`}>
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-slate-500">Step {idx + 1}</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              step.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              step.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}>{step.difficulty}</span>
                          </div>
                          <h3 className="text-base font-black text-white">{step.title || step.topic}</h3>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold border flex-shrink-0 ${styles.badge}`}>
                          <Icon className="w-3 h-3" />
                          {styles.badgeText}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                        {step.description || `Master core ${step.topic} algorithmic patterns and time complexity bounds.`}
                      </p>

                      {/* Remediation Alert */}
                      {step.remediation_note && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                          <span>{step.remediation_note}</span>
                        </div>
                      )}

                      {/* Practice Problems */}
                      {step.recommended_problems && step.recommended_problems.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-dark-800/60">
                          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Milestone Challenges
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {step.recommended_problems.map((prob, i) => {
                              // prob can be either an object {id, slug, title, difficulty, is_solved} or a string
                              const isObj = typeof prob === 'object' && prob !== null;
                              const title = isObj ? prob.title : prob;
                              const slug = isObj ? prob.slug : null;
                              const diff = isObj ? prob.difficulty : null;
                              const isSolved = isObj ? prob.is_solved : false;
                              const href = slug ? `/problems/${slug}` : `/problems`;
                              return (
                                <Link
                                  key={i}
                                  to={href}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all group/link ${
                                    isSolved
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                      : 'bg-dark-850 border-dark-700 text-slate-200 hover:border-cyan-500/40 hover:bg-cyan-500/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                                    <span className="font-medium truncate">{title}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {diff && (
                                      <span className={`text-[9px] font-bold px-1.5 rounded ${
                                        diff === 'Easy' ? 'text-emerald-400 bg-emerald-500/10' :
                                        diff === 'Medium' ? 'text-amber-400 bg-amber-500/10' :
                                        'text-rose-400 bg-rose-500/10'
                                      }`}>{diff}</span>
                                    )}
                                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover/link:text-cyan-400 group-hover/link:translate-x-0.5 transition-all" />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* CTA Footer */}
                      {step.status !== 'locked' && (
                        <div className="mt-4 pt-3 border-t border-dark-800/40 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-mono">
                            {step.recommended_problems?.length || 0} practice problems available
                          </span>
                          <Link
                            to={`/problems?topic=${encodeURIComponent(step.topic)}`}
                            className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            <span>All {step.topic} Problems</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoadmapPage;
