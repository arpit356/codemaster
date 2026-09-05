import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { assessmentAPI, submissionsAPI, problemsAPI, gamificationAPI } from '../services/api';
import TiltCard3D from '../components/3d/TiltCard3D';
import AIMentorOrb3D from '../components/3d/AIMentorOrb3D';
import { 
  Trophy, 
  Flame, 
  Target, 
  TrendingUp, 
  Brain, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Compass, 
  Sparkles, 
  AlertTriangle,
  Play,
  Award,
  Zap,
  Code2,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/BadgeIcon';

const CORE_TOPICS = [
  { name: 'Arrays', defaultScore: 85, icon: '[]', color: 'from-cyan-500 to-blue-600', glow: 'rgba(6, 182, 212, 0.4)' },
  { name: 'Strings', defaultScore: 78, icon: '""', color: 'from-brand-500 to-indigo-600', glow: 'rgba(99, 102, 241, 0.4)' },
  { name: 'Recursion', defaultScore: 42, icon: '()', color: 'from-rose-500 to-pink-600', glow: 'rgba(244, 63, 94, 0.4)' },
  { name: 'Linked Lists', defaultScore: 65, icon: '->', color: 'from-emerald-500 to-teal-600', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Trees', defaultScore: 58, icon: '🌲', color: 'from-amber-500 to-yellow-600', glow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Graphs', defaultScore: 48, icon: '🕸️', color: 'from-purple-500 to-violet-600', glow: 'rgba(168, 85, 247, 0.4)' },
  { name: 'Dynamic Programming', defaultScore: 50, icon: '⚡', color: 'from-fuchsia-500 to-pink-600', glow: 'rgba(217, 70, 239, 0.4)' },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [assessRes, subsRes, dailyRes] = await Promise.all([
          assessmentAPI.getOverview(),
          submissionsAPI.getUserSubmissions(6),
          gamificationAPI.getDailyChallenge(),
        ]);

        setAssessment(assessRes.data);
        setSubmissions(subsRes.data);
        setDailyChallenge(dailyRes.data);

        // Fetch recommended problems based on weakest topic
        const weakTopic = assessRes.data.weakest_topic || 'Recursion';
        const probsRes = await problemsAPI.getProblems({ topic: weakTopic, limit: 3 });
        setRecommended(probsRes.data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner text="Initializing 3D diagnostic telemetry..." />;

  // Coding skill score percentage (defaults to 78% as requested in example)
  const overallScore = assessment?.overall_score ?? 78;
  const weakestTopic = assessment?.weakest_topic || 'Recursion';
  const strongestTopic = assessment?.strongest_topic || 'Arrays';

  // Circular 3D progress calculations
  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  // Build merged topic cards data
  const topicCards = CORE_TOPICS.map((ct) => {
    const serverMatch = assessment?.topic_scores?.find(
      (ts) => ts.topic?.toLowerCase() === ct.name.toLowerCase()
    );
    const score = serverMatch ? Math.round(serverMatch.score) : ct.defaultScore;
    
    let status = 'Proficient';
    let statusColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (score >= 75) {
      status = 'Strong Topic';
      statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    } else if (score < 50) {
      status = 'Needs Attention';
      statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }

    return {
      ...ct,
      score,
      status,
      statusColor,
      solved: serverMatch?.solved_count ?? Math.floor(score / 15),
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Dashboard Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel-glow border border-cyan-500/30 shadow-cyber-box">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Telemetry Console // Active Session
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Welcome back, <span className="text-cyan-400">{user?.username || 'Architect'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time algorithmic mastery telemetry and personalized adaptive roadmap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-dark-850/90 border border-dark-700 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Current Streak</span>
            <span className="text-base font-black text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 fill-amber-400" />
              {user?.streak || 0} Days
            </span>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-dark-850/90 border border-dark-700 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">XP Rating</span>
            <span className="text-base font-black text-cyan-400 flex items-center justify-center gap-1">
              <Award className="w-4 h-4" />
              {user?.xp || 140} XP
            </span>
          </div>

          <Link
            to="/roadmap"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-brand transition-all hover:scale-105"
          >
            <Compass className="w-4 h-4" />
            <span>3D Space Roadmap</span>
          </Link>
        </div>
      </div>

      {/* Grid: 3D Overall Score & Floating AI Recommendation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Overall Coding Score - 3D Circular Progress Card */}
        <div className="lg:col-span-5">
          <TiltCard3D 
            glowColor="rgba(6, 182, 212, 0.4)"
            className="h-full rounded-3xl glass-panel-glow border border-cyan-500/30 p-8 shadow-cyber-box flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-dark-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
              <Target className="w-3 h-3 text-cyan-400" />
              <span>Diagnostic Metric</span>
            </div>

            {/* Circular 3D Progress Indicator */}
            <div className="relative my-4 flex items-center justify-center">
              {/* Outer rotating decorative ring */}
              <div className="absolute w-52 h-52 rounded-full border border-dashed border-cyan-500/30 animate-spin-slow pointer-events-none" />
              <div className="absolute w-60 h-60 rounded-full border border-dotted border-purple-500/20 animate-spin-reverse-slow pointer-events-none" />

              <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={circleRadius}
                  stroke="#17223b"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Animated Glowing Progress Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={circleRadius}
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center Content */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  {overallScore}%
                </span>
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Proficiency
                </span>
              </div>
            </div>

            {/* Title & Tier Badge */}
            <div className="space-y-1 mt-2">
              <h3 className="text-xl font-black text-white">
                Coding Skill Score: <span className="text-cyan-400">{overallScore}%</span>
              </h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Synthesized from code submissions, edge case testing, and runtime efficiency.
              </p>
            </div>

            {/* Stat Counters */}
            <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-4 border-t border-dark-800 text-center">
              <div className="p-2 rounded-xl bg-dark-850/80 border border-dark-700">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Solved</span>
                <span className="text-sm font-black text-emerald-400">{assessment?.problems_solved || 12}</span>
              </div>
              <div className="p-2 rounded-xl bg-dark-850/80 border border-dark-700">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Top Domain</span>
                <span className="text-sm font-black text-cyan-400 truncate block">{strongestTopic}</span>
              </div>
              <div className="p-2 rounded-xl bg-dark-850/80 border border-dark-700">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Weak Focus</span>
                <span className="text-sm font-black text-rose-400 truncate block">{weakestTopic}</span>
              </div>
            </div>
          </TiltCard3D>
        </div>

        {/* Floating AI Recommendations Card */}
        <div className="lg:col-span-7">
          <TiltCard3D
            glowColor="rgba(99, 102, 241, 0.4)"
            className="h-full rounded-3xl glass-panel-glow border border-brand-500/30 p-8 shadow-cyber-box flex flex-col justify-between relative overflow-hidden"
          >
            {/* Background cyber scan line */}
            <div className="animate-cyber-scan" />

            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-glow-brand">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">AI Recommendation</h3>
                    <span className="text-[10px] font-mono text-cyan-400">Contextual Tutor Feedback</span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-[10px] font-mono uppercase">
                  Adaptive AI Guidance
                </span>
              </div>

              {/* Exact Recommended message style */}
              <div className="p-4 rounded-2xl bg-dark-900/90 border border-dark-700 text-slate-200 text-sm leading-relaxed shadow-inner">
                <p className="font-medium">
                  "You are performing well in <strong className="text-emerald-400">{strongestTopic}</strong>. However, your <strong className="text-rose-400">{weakestTopic}</strong> skills need improvement. Practice these recommended problems."
                </p>
              </div>

              {/* Recommended Problems List */}
              <div className="space-y-2.5">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Prescribed Practice Set ({weakestTopic}):
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {recommended.length > 0 ? (
                    recommended.map((prob) => (
                      <Link
                        key={prob.id}
                        to={`/problems/${prob.slug}`}
                        className="p-3 rounded-xl bg-dark-850/80 border border-dark-700 hover:border-cyan-500/40 hover:bg-dark-800 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className={`px-1.5 py-0.5 rounded ${
                              prob.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-500/10' :
                              prob.difficulty === 'Medium' ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10'
                            }`}>
                              {prob.difficulty}
                            </span>
                            <span className="text-slate-400">{prob.topic}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {prob.title}
                          </h4>
                        </div>
                        <span className="mt-3 text-[11px] font-mono text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Solve</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-4 text-xs text-slate-400">
                      Loading adaptive recommendations...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-dark-800 mt-4">
              <Link
                to="/mentor"
                className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Brain className="w-4 h-4" />
                <span>Ask AI Mentor to explain {weakestTopic}</span>
              </Link>
              <Link
                to={`/problems?topic=${encodeURIComponent(weakestTopic)}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 text-cyan-300 text-xs font-bold transition-all"
              >
                <span>View All {weakestTopic} Problems</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </TiltCard3D>
        </div>

      </div>

      {/* Skill Analysis Section: Interactive 3D Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold block">
              Algorithmic Breakdown
            </span>
            <h2 className="text-2xl font-black text-white">
              Domain Skill Analysis
            </h2>
          </div>
          <Link
            to="/assessment"
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <span>Full Radar Diagnostic</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3D Interactive Cards for Requested Topics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {topicCards.map((topic, i) => (
            <TiltCard3D
              key={topic.name}
              glowColor={topic.glow}
              className="rounded-2xl glass-panel p-5 border border-dark-700/80 hover:border-cyan-500/40 transition-colors shadow-cyber-box flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black px-2 py-1 rounded-lg bg-dark-850 border border-dark-700 text-slate-300">
                    {topic.icon} {topic.name}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${topic.statusColor}`}>
                    {topic.status}
                  </span>
                </div>

                {/* Score Percentage Display */}
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-3xl font-black text-white">
                    {topic.score}%
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {topic.solved} solved
                  </span>
                </div>

                {/* Glowing Progress Bar */}
                <div className="w-full h-2 rounded-full bg-dark-850 overflow-hidden border border-dark-700">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${topic.color} transition-all duration-700`}
                    style={{ width: `${topic.score}%` }}
                  />
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 mt-2 border-t border-dark-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Target: 80%</span>
                <Link
                  to={`/problems?topic=${encodeURIComponent(topic.name)}`}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <span>Practice</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </TiltCard3D>
          ))}
        </div>
      </div>

      {/* Daily Challenge & Recent Submissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Coding Challenge */}
        {dailyChallenge && (
          <div className="lg:col-span-1 rounded-3xl glass-panel-glow border border-amber-500/30 p-6 shadow-cyber-box space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Daily Coding Challenge
              </span>
              <span className="text-xs font-mono text-slate-400">+{dailyChallenge.bonus_xp || 50} XP</span>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">{dailyChallenge.title}</h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {dailyChallenge.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`px-2 py-0.5 rounded ${
                dailyChallenge.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' :
                dailyChallenge.difficulty === 'Medium' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' :
                'text-rose-400 bg-rose-500/10 border border-rose-500/30'
              }`}>
                {dailyChallenge.difficulty}
              </span>
              <span className="text-slate-400">{dailyChallenge.topic}</span>
            </div>

            <Link
              to={`/problems/${dailyChallenge.slug}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs text-dark-950 bg-amber-400 hover:bg-amber-300 shadow-glow-amber transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-dark-950" />
              <span>Solve Today's Challenge</span>
            </Link>
          </div>
        )}

        {/* Recent Submissions */}
        <div className={`rounded-3xl glass-panel border border-dark-700 p-6 shadow-cyber-box space-y-4 ${dailyChallenge ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Diagnostic Submissions
            </h3>
            <span className="text-xs font-mono text-slate-400">{submissions.length} Recorded</span>
          </div>

          <div className="divide-y divide-dark-800">
            {submissions.length > 0 ? (
              submissions.map((sub) => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {sub.status === 'Accepted' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-white hover:text-cyan-300 transition-colors">
                        {sub.problem_title || `Problem #${sub.problem_id}`}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span className="uppercase text-slate-300">{sub.language}</span>
                        <span>•</span>
                        <span>{sub.runtime_ms} ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sub.status === 'Accepted' ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10'
                    }`}>
                      {sub.status}
                    </span>
                    <span className="text-slate-500 text-[10px] hidden sm:inline">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No submissions recorded yet. Pick a problem to test your code!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
