import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThreeHeroWorkspace from '../components/3d/ThreeHeroWorkspace';
import TiltCard3D from '../components/3d/TiltCard3D';
import { 
  Code2, 
  Brain, 
  Sparkles, 
  Compass, 
  Trophy, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Terminal, 
  LineChart,
  ShieldAlert,
  Play,
  Layers,
  Cpu,
  Flame
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoStart = async (role) => {
    await demoLogin(role);
    navigate('/dashboard');
  };

  const featureCards = [
    {
      icon: Brain,
      title: "Automatic Skill Assessment",
      tag: "Diagnostic Engine",
      desc: "Deep algorithmic profiling calculating per-topic proficiency across Arrays, Recursion, Trees, Graphs, and DP with visual analytics.",
      color: "from-cyan-500 to-blue-600",
      accent: "text-cyan-400",
      glow: "rgba(6, 182, 212, 0.35)",
    },
    {
      icon: Sparkles,
      title: "AI Code Reviewer",
      tag: "Instant Big-O",
      desc: "Pedagogical hints, logic explanations, vulnerability detection, and exact Time & Space Complexity analysis without giving away spoilers.",
      color: "from-brand-500 to-indigo-600",
      accent: "text-brand-400",
      glow: "rgba(99, 102, 241, 0.35)",
    },
    {
      icon: Compass,
      title: "Personalized 3D Roadmap",
      tag: "Adaptive Path",
      desc: "An intelligent milestone pathway through space that schedules remediation exercises whenever weak algorithmic topics are detected.",
      color: "from-emerald-500 to-teal-600",
      accent: "text-emerald-400",
      glow: "rgba(16, 185, 129, 0.35)",
    },
    {
      icon: Terminal,
      title: "Pro Online Code Editor",
      tag: "Multi-Language",
      desc: "Integrated Monaco Editor supporting Python, C++, Java, and C with sandboxed execution, test cases, and real-time I/O verification.",
      color: "from-violet-500 to-purple-600",
      accent: "text-violet-400",
      glow: "rgba(168, 85, 247, 0.35)",
    },
    {
      icon: Trophy,
      title: "Gamified Mastery System",
      tag: "Streaks & XP",
      desc: "Daily algorithmic challenges, consistency streak multipliers, unlockable achievement badges, and global rank leaderboard.",
      color: "from-amber-500 to-orange-600",
      accent: "text-amber-400",
      glow: "rgba(245, 158, 11, 0.35)",
    },
    {
      icon: Cpu,
      title: "AI Coding Mentor",
      tag: "24/7 Digital Tutor",
      desc: "Context-aware AI mentor chatbot that explains tough concepts in plain English, debugs edge cases, and guides interview readiness.",
      color: "from-rose-500 to-pink-600",
      accent: "text-rose-400",
      glow: "rgba(244, 63, 94, 0.35)",
    },
  ];

  const topics = [
    "Arrays", "Strings", "Linked Lists", "Stacks & Queues", "Recursion", "Trees", "Graphs", "Dynamic Programming"
  ];

  return (
    <div className="relative overflow-hidden pt-4 pb-20 space-y-16">
      
      {/* Background radial ambient lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-cyan-500/15 via-brand-600/15 to-transparent blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[800px] left-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[140px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 text-center space-y-8">
        
        {/* Futuristic Sub-badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold shadow-glow-cyan animate-pulse-subtle">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Next-Generation Adaptive Coding & AI Learning Workspace</span>
        </div>

        {/* Main Heading (Exact as required) */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1] sm:leading-none">
          Master Coding. <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.3)]">
            Understand Your Skills.
          </span> <br className="hidden sm:block" />
          Grow Faster.
        </h1>

        {/* Subheading (Exact as required) */}
        <p className="mt-4 text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          CodeMentor AI analyzes your coding skills, identifies your weaknesses, and creates a personalized learning path to help you become a better programmer.
        </p>

        {/* Two Futuristic Action Buttons (Exact as required) */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? "/problems" : "/register"}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-sm tracking-wide text-dark-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-300 hover:from-cyan-300 hover:to-teal-200 shadow-glow-cyan transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-dark-950" />
            <span>Start Coding</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            to={isAuthenticated ? "/assessment" : "/assessment"}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-sm tracking-wide text-cyan-300 bg-dark-900/90 border border-cyan-500/50 hover:bg-cyan-500/15 shadow-cyber-box transition-all hover:scale-105 active:scale-95"
          >
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>Explore Your Skills</span>
          </Link>

          {/* Instant Demo Sandbox Access */}
          {!isAuthenticated && (
            <button
              onClick={() => handleDemoStart('user')}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-xs text-slate-300 bg-dark-850/80 border border-dark-700 hover:border-slate-500 hover:text-white transition-all"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Instant Demo Account</span>
            </button>
          )}
        </div>

        {/* Interactive 3D Coding Workspace in the Center */}
        <div className="pt-6">
          <ThreeHeroWorkspace />
        </div>

      </section>

      {/* Topics Ticker Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/20 shadow-cyber-box flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono">
          <span className="text-cyan-400 font-bold uppercase tracking-wider pr-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Algorithmic Domains:
          </span>
          {topics.map((t, i) => (
            <Link
              key={i}
              to={`/problems?topic=${encodeURIComponent(t)}`}
              className="px-3 py-1.5 rounded-xl bg-dark-850/80 border border-dark-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all"
            >
              {t}
            </Link>
          ))}
        </div>
      </div>

      {/* 3D Interactive Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
            Autonomous Skill Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Designed for Developers Who Want Real Mastery
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Interactive 3D diagnostics, sandboxed execution, and pedagogical AI tutoring built from the ground up.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <TiltCard3D 
                key={idx} 
                glowColor={feat.glow}
                className="rounded-3xl glass-panel p-6 border border-dark-700/80 hover:border-cyan-500/40 transition-colors shadow-cyber-box"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-dark-850 border border-dark-700 text-slate-400">
                      {feat.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <span>Explore Capability</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden glass-panel-glow border border-cyan-500/30 p-8 sm:p-12 text-center space-y-6 shadow-glow-cyan">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Ready to upgrade your algorithmic instincts?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white max-w-2xl mx-auto">
            Stop Guessing Your Level. <br />
            <span className="text-cyan-400">Start Knowing It.</span>
          </h2>

          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto">
            Join programmers mastering algorithms with AI diagnostic evaluations and personalized space-pathway milestones.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl font-bold text-dark-950 bg-cyan-400 hover:bg-cyan-300 shadow-glow-cyan transition-all hover:scale-105"
            >
              Start Free Today
            </Link>
            <button
              onClick={() => handleDemoStart('user')}
              className="px-6 py-3.5 rounded-xl font-bold text-slate-300 bg-dark-850 border border-dark-700 hover:border-slate-500 transition-all"
            >
              Demo Sandbox
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
