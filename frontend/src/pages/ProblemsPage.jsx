import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { problemsAPI } from '../services/api';
import { 
  Code2, 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/BadgeIcon';

const ALL_TOPICS = [
  "All",
  "Arrays",
  "Strings",
  "Linked Lists",
  "Stacks",
  "Queues",
  "Recursion",
  "Trees",
  "Graphs",
  "Dynamic Programming"
];

const ProblemsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic') || 'All';

  const [problems, setProblems] = useState([]);
  const [topicsStats, setTopicsStats] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await problemsAPI.getTopics();
        setTopicsStats(res.data);
      } catch (err) {
        console.error('Error fetching topics:', err);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const params = {
          topic: selectedTopic !== 'All' ? selectedTopic : undefined,
          difficulty: difficulty !== 'All' ? difficulty : undefined,
          status: status !== 'all' ? status : undefined,
          search: searchQuery.trim() || undefined,
        };
        const res = await problemsAPI.getProblems(params);
        setProblems(res.data);
      } catch (err) {
        console.error('Error fetching problems:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [selectedTopic, difficulty, status, searchQuery]);

  const handleTopicSelect = (t) => {
    setSelectedTopic(t);
    if (t !== 'All') {
      setSearchParams({ topic: t });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Code2 className="w-4 h-4 text-cyan-400" />
          Algorithmic Practice Library
        </div>
        <h1 className="text-3xl font-extrabold text-white mt-1">
          Coding Challenges
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Solve curated algorithmic problems, test your code against visible & hidden test cases, and receive comprehensive AI feedback on logic and time complexity.
        </p>
      </div>

      {/* Free Playground CTA Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-brand-500/5 to-purple-500/10 border border-cyan-500/25">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Coding Playground</h3>
            <p className="text-xs text-slate-400 mt-0.5">Write and run any code freely without a problem statement. Get live AI skill analysis while you code.</p>
          </div>
        </div>
        <Link
          to="/playground"
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-brand-600 hover:from-cyan-400 hover:to-brand-500 text-white text-xs font-black shadow-glow-cyan transition-all hover:scale-105 flex-shrink-0"
        >
          <Flame className="w-3.5 h-3.5 fill-white" />
          <span>Open Playground</span>
        </Link>
      </div>

      {/* Topic Filter Chips Scrollable Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {ALL_TOPICS.map((t) => {
          const isSelected = selectedTopic === t;
          return (
            <button
              key={t}
              onClick={() => handleTopicSelect(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-glow-brand font-bold'
                  : 'bg-dark-850 text-slate-400 hover:text-white border border-dark-700 hover:border-slate-500'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-dark-900 border border-dark-800">
        
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-850 border border-dark-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="sm:col-span-3">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-dark-850 border border-dark-700 text-sm text-slate-300 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-dark-850 border border-dark-700 text-sm text-slate-300 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
          </select>
        </div>

      </div>

      {/* Problems Table / List */}
      {loading ? (
        <LoadingSpinner text="Retrieving problems..." />
      ) : (
        <div className="glass-panel rounded-3xl border border-dark-700 overflow-hidden shadow-xl">
          <div className="divide-y divide-dark-800">
            {problems.length > 0 ? (
              problems.map((prob, idx) => (
                <Link
                  key={prob.id}
                  to={`/problems/${prob.slug}`}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-dark-850/80 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 text-center font-mono text-xs text-slate-500">
                      {prob.is_solved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 inline" />
                      ) : (
                        `#${idx + 1}`
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {prob.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-slate-400 bg-dark-800 px-2 py-0.5 rounded">
                          {prob.topic}
                        </span>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {prob.acceptance_rate}% Acceptance
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-bold font-mono px-3 py-1 rounded-full ${
                        prob.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : prob.difficulty === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {prob.difficulty}
                    </span>

                    <div className="p-2 rounded-lg bg-dark-800 group-hover:bg-brand-600 text-slate-400 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <p className="text-base font-medium">No problems found matching your filters.</p>
                <button
                  onClick={() => { setSelectedTopic('All'); setDifficulty('All'); setStatus('all'); setSearchQuery(''); }}
                  className="text-xs text-brand-400 hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProblemsPage;
