import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Github, Heart, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-dark-800/80 bg-dark-950/75 backdrop-blur-md py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                CodeMentor<span className="text-cyan-400">.AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              An intelligent, adaptive programming platform that analyzes your algorithmic performance, identifies weak topics, and guides you toward software engineering excellence.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Multi-Language Sandbox & AI Mentor Online</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 font-mono">
              Practice Topics
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/problems?topic=Arrays" className="hover:text-cyan-400 transition-colors">Arrays & Two Pointers</Link></li>
              <li><Link to="/problems?topic=Strings" className="hover:text-cyan-400 transition-colors">Strings & Hashing</Link></li>
              <li><Link to="/problems?topic=Trees" className="hover:text-cyan-400 transition-colors">Trees & Traversals</Link></li>
              <li><Link to="/problems?topic=Dynamic%20Programming" className="hover:text-cyan-400 transition-colors">Dynamic Programming</Link></li>
              <li><Link to="/problems?topic=Graphs" className="hover:text-cyan-400 transition-colors">Graphs & BFS/DFS</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 font-mono">
              System Core
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/assessment" className="hover:text-brand-400 transition-colors">Skill Diagnostic</Link></li>
              <li><Link to="/roadmap" className="hover:text-brand-400 transition-colors">Personalized Roadmap</Link></li>
              <li><Link to="/mentor" className="hover:text-brand-400 transition-colors">Socratic AI Mentor</Link></li>
              <li><Link to="/leaderboard" className="hover:text-brand-400 transition-colors">Global Leaderboard</Link></li>
              <li><span className="text-xs px-2 py-0.5 rounded bg-dark-800 text-slate-300">FastAPI + React + Monaco</span></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-dark-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 CodeMentor AI Platform. Built for developers striving for mastery.</p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span>Powered by Gemini & Algorithmic Heuristics</span>
            <span>•</span>
            <span>Secure Sandboxed Execution</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
