import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { assessmentAPI } from '../services/api';
import { 
  Brain, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  Sparkles, 
  Layers, 
  Award,
  Zap,
  Activity
} from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { LoadingSpinner } from '../components/common/BadgeIcon';

const SkillAssessmentPage = () => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await assessmentAPI.getOverview();
        setAssessment(res.data);
      } catch (err) {
        console.error('Error fetching assessment:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, []);

  if (loading) return <LoadingSpinner text="Analyzing multidimensional skill parameters..." />;

  const radarData = assessment?.topic_scores?.map((ts) => ({
    topic: ts.topic,
    score: ts.score,
    fullMark: 100,
  })) || [];

  const barColors = {
    Mastered: '#10b981',
    Proficient: '#06b6d4',
    Developing: '#f59e0b',
    Novice: '#64748b',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Brain className="w-4 h-4 text-cyan-400" />
            Automatic Algorithmic Assessment
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            Skill Diagnostic Report
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Calculated across problem difficulty, success ratios, attempt counts, and algorithmic efficiency.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/roadmap"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand transition-all flex items-center gap-2"
          >
            <span>Open Adaptive Roadmap</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Top Diagnostic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Overall Score */}
        <div className="glass-panel p-6 rounded-3xl border border-dark-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-400">Composite Score</span>
            <Activity className="w-5 h-5 text-brand-400" />
          </div>
          <div className="my-4">
            <span className="text-5xl font-black text-white">{assessment?.overall_score || 0}%</span>
            <span className="text-xs text-slate-400 block mt-1">Weighted capability index</span>
          </div>
          <div className="w-full h-2 rounded-full bg-dark-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400"
              style={{ width: `${assessment?.overall_score || 0}%` }}
            />
          </div>
        </div>

        {/* Highest Mastery Topic */}
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Highest Proficiency
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Strongest
            </span>
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-bold text-white">{assessment?.strongest_topic || 'Arrays'}</h3>
            <p className="text-xs text-slate-300 mt-1">
              Consistently demonstrates correct asymptotic complexity and minimal attempts.
            </p>
          </div>
          <Link
            to={`/problems?topic=${encodeURIComponent(assessment?.strongest_topic || 'Arrays')}&difficulty=Hard`}
            className="text-xs text-emerald-300 hover:text-white font-bold flex items-center gap-1 mt-2"
          >
            Level up to Hard problems <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Primary Growth Area */}
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Primary Growth Area
            </span>
            <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full">
              Action Required
            </span>
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-bold text-white">{assessment?.weakest_topic || 'Recursion'}</h3>
            <p className="text-xs text-slate-300 mt-1">
              Lower success accuracy detected. Targeted practice will yield the highest return.
            </p>
          </div>
          <Link
            to={`/problems?topic=${encodeURIComponent(assessment?.weakest_topic || 'Recursion')}`}
            className="text-xs text-rose-300 hover:text-white font-bold flex items-center gap-1 mt-2"
          >
            Practice {assessment?.weakest_topic || 'Recursion'} Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Radar Chart & Topic Progress List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Radar Chart View */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-dark-700">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Algorithmic Competency Footprint
            </h3>
            <p className="text-xs text-slate-400">9 Core Computer Science & Interview Paradigms</p>
          </div>

          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#233252" />
                <PolarAngleAxis dataKey="topic" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
                <Radar
                  name="Proficiency %"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.45}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Horizontal Breakdown per Topic */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-dark-700 space-y-4">
          <div className="mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              Per-Topic Proficiency Breakdown
            </h3>
            <p className="text-xs text-slate-400">Real-time mastery ranking and problem tallies</p>
          </div>

          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {assessment?.topic_scores?.map((ts) => (
              <div
                key={ts.topic}
                className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{ts.topic}</span>
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        ts.status === 'Mastered'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : ts.status === 'Proficient'
                          ? 'bg-cyan-500/15 text-cyan-400'
                          : ts.status === 'Developing'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ts.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {ts.score}%
                    </span>
                    <Link
                      to={`/problems?topic=${encodeURIComponent(ts.topic)}`}
                      className="text-slate-400 hover:text-white"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-dark-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${ts.score}%`,
                      backgroundColor: barColors[ts.status] || '#6366f1',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{ts.problems_solved} Problems Solved</span>
                  <span>{ts.total_attempts} Submissions Made</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SkillAssessmentPage;
