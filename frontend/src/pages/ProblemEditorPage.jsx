import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import { problemsAPI, submissionsAPI, mentorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AIMentorOrb3D from '../components/3d/AIMentorOrb3D';
import useCodeAnalysis from '../hooks/useCodeAnalysis';
import LiveSkillPanel from '../components/editor/LiveSkillPanel';
import { 
  Play, 
  Send, 
  RotateCcw, 
  Code2, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  Bot,
  Zap,
  Check,
  AlertTriangle,
  Lightbulb,
  X,
  Timer,
  HardDrive,
  Activity,
  Trophy
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/BadgeIcon';
import MarkdownRenderer from '../components/common/MarkdownRenderer';

const LANGUAGE_CONFIGS = {
  python: { label: 'Python 3', monacoLang: 'python' },
  cpp: { label: 'C++ 17', monacoLang: 'cpp' },
  java: { label: 'Java 15', monacoLang: 'java' },
  c: { label: 'C 11', monacoLang: 'c' },
};

const ProblemEditorPage = () => {
  const { slug } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  // Console & Execution State
  const [consoleTab, setConsoleTab] = useState('testcases'); // 'testcases' | 'result'
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Real-Time Coding Skill Analysis Hook
  const {
    scores,
    mistakes,
    aiTips,
    recommendations,
    summary: analysisSummary,
    isAnalyzing,
    recordActivity,
  } = useCodeAnalysis({
    code,
    language,
    problemId: problem?.id,
    problemTitle: problem?.title,
    problemTopic: problem?.topic,
  });

  // Accordion & Modals
  const [expandedHint, setExpandedHint] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [mentorDrawerOpen, setMentorDrawerOpen] = useState(false);
  const [mentorQuestion, setMentorQuestion] = useState('');
  const [mentorReply, setMentorReply] = useState('');
  const [mentorLoading, setMentorLoading] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await problemsAPI.getProblemBySlug(slug);
        setProblem(res.data);
        const starter = res.data.starter_codes?.[language] || '# Write your solution here\n';
        setCode(starter);
      } catch (err) {
        console.error('Error fetching problem:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [slug]);

  // When language changes, update starter code
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (problem?.starter_codes?.[newLang]) {
      setCode(problem.starter_codes[newLang]);
    }
  };

  const handleResetCode = () => {
    if (problem?.starter_codes?.[language]) {
      setCode(problem.starter_codes[language]);
    }
  };

  // Run Code (Against sample cases or custom input)
  const handleRunCode = async () => {
    setExecuting(true);
    setConsoleTab('result');
    setRunResult(null);

    try {
      const res = await submissionsAPI.runCode(
        code,
        language,
        isCustomInput ? null : problem.id,
        isCustomInput ? customInput : null
      );
      setRunResult(res.data);
    } catch (err) {
      setRunResult({
        status: 'Error',
        stdout: '',
        stderr: err.response?.data?.detail || 'Execution failed.',
        runtime_ms: 0,
        test_results: []
      });
    } finally {
      setExecuting(false);
    }
  };

  // Submit Code (Full test cases + AI Review)
  const handleSubmitCode = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setConsoleTab('result');

    try {
      const res = await submissionsAPI.submitCode(problem.id, code, language);
      setSubmissionResult(res.data);
      setRunResult({
        status: res.data.status,
        stdout: '',
        stderr: res.data.status !== 'Accepted' ? 'Some test cases failed.' : '',
        runtime_ms: res.data.runtime_ms,
        memory_kb: res.data.memory_kb,
        test_results: []
      });

      // Fire celebratory confetti if Accepted!
      if (res.data.status === 'Accepted') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        refreshUser();
      }

      setReviewModalOpen(true);
    } catch (err) {
      setRunResult({
        status: 'Error',
        stdout: '',
        stderr: err.response?.data?.detail || 'Submission failed.',
        runtime_ms: 0,
        test_results: []
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Ask Mentor quick questions
  const handleAskMentor = async (query = null) => {
    const prompt = query || mentorQuestion;
    if (!prompt.trim()) return;

    setMentorLoading(true);
    setMentorDrawerOpen(true);

    try {
      const res = await mentorAPI.chat(prompt, problem.title, code);
      setMentorReply(res.data.reply);
      setMentorQuestion('');
    } catch (err) {
      setMentorReply("I'm currently unable to reach the mentoring service. Please try again.");
    } finally {
      setMentorLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Configuring coding environment..." />;
  if (!problem) return <div className="text-center py-20 text-slate-400">Problem not found.</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-dark-950">
      
      {/* Top Header Bar — Futuristic Cyber HUD */}
      <div className="px-4 py-2.5 glass-panel border-b border-cyan-500/20 flex items-center justify-between flex-shrink-0 shadow-cyber-box">
        <div className="flex items-center gap-3">
          <Link
            to="/problems"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight">{problem.title}</h1>
            <span
              className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full ${
                problem.difficulty === 'Easy'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : problem.difficulty === 'Medium'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {problem.difficulty}
            </span>
            <span className="text-xs font-mono text-slate-400 bg-dark-800 px-2 py-0.5 rounded">
              {problem.topic}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Ask Mentor Button */}
          <button
            onClick={() => handleAskMentor(`Can you provide a gentle hint for ${problem.title}?`)}
            className="px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Mentor</span>
          </button>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-dark-850 border border-dark-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          >
            {Object.entries(LANGUAGE_CONFIGS).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            title="Reset to starter boilerplate"
            className="p-1.5 rounded-xl bg-dark-850 border border-dark-700 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={executing || submitting}
            className="px-4 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 fill-emerald-400 text-emerald-400 ${executing ? 'animate-spin' : ''}`} />
            <span>{executing ? 'Executing...' : 'Run Code'}</span>
          </button>

          {/* Submit Solution Button */}
          <button
            onClick={handleSubmitCode}
            disabled={executing || submitting}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-brand-600 hover:from-cyan-400 hover:to-brand-500 text-white text-xs font-black shadow-glow-cyan transition-all flex items-center gap-1.5 disabled:opacity-50 hover:scale-105"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Analyzing...' : 'Submit Solution'}</span>
          </button>
        </div>
      </div>

      {/* Main 3-Panel Workspace: Problem (3) | Editor (6) | Live AI Coach (3) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Panel 1: Problem Details & Constraints (col-span-3) */}
        <div className="lg:col-span-3 border-r border-dark-800/80 overflow-y-auto p-5 space-y-5 bg-dark-950/70 backdrop-blur-sm">
          
          {/* Description */}
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              Problem Description
            </h3>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {problem.description}
            </div>
          </div>

          {/* Input & Output Format */}
          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-dark-900 border border-dark-800">
              <span className="font-bold text-slate-400 block font-mono mb-1">INPUT FORMAT</span>
              <span className="text-slate-300 whitespace-pre-line">{problem.input_format}</span>
            </div>
            <div className="p-3 rounded-xl bg-dark-900 border border-dark-800">
              <span className="font-bold text-slate-400 block font-mono mb-1">OUTPUT FORMAT</span>
              <span className="text-slate-300 whitespace-pre-line">{problem.output_format}</span>
            </div>
          </div>

          {/* Examples */}
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
              Examples
            </h3>
            <div className="space-y-3">
              {problem.examples?.map((ex, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-dark-900 border border-dark-800 space-y-2 text-xs font-mono">
                  <span className="text-brand-400 font-bold block">Example {i + 1}:</span>
                  <div>
                    <span className="text-slate-500 block">Input:</span>
                    <pre className="text-slate-200 bg-dark-950 p-2 rounded-lg mt-0.5">{ex.input}</pre>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Output:</span>
                    <pre className="text-emerald-400 bg-dark-950 p-2 rounded-lg mt-0.5">{ex.output}</pre>
                  </div>
                  {ex.explanation && (
                    <p className="text-slate-400 font-sans text-xs pt-1">
                      <span className="font-semibold text-slate-300">Explanation:</span> {ex.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Constraints */}
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              Constraints
            </h3>
            <pre className="p-3 rounded-xl bg-dark-900 border border-dark-800 text-xs font-mono text-slate-300 whitespace-pre-line">
              {problem.constraints}
            </pre>
          </div>

          {/* Progressive Hints Accordion */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                Progressive Socratic Hints
              </h3>
              <div className="space-y-2">
                {problem.hints.map((hint, idx) => {
                  const isOpen = expandedHint === idx;
                  return (
                    <div key={idx} className="rounded-xl border border-dark-800 bg-dark-900 overflow-hidden">
                      <button
                        onClick={() => setExpandedHint(isOpen ? null : idx)}
                        className="w-full px-3 py-2.5 text-left text-xs font-medium text-slate-300 flex items-center justify-between hover:bg-dark-850"
                      >
                        <span>Hint {idx + 1}</span>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 text-xs text-slate-400 leading-relaxed border-t border-dark-800/60 pt-2">
                          {hint}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Panel 2: Monaco Editor & Interactive Console (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col h-full overflow-hidden bg-dark-900 border-l border-cyan-500/10">
          
          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[300px] border-b border-dark-800 relative">
            <Editor
              height="100%"
              language={LANGUAGE_CONFIGS[language]?.monacoLang || 'python'}
              theme="vs-dark"
              value={code}
              onChange={(newCode) => {
                setCode(newCode || '');
                recordActivity();
              }}
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                lineNumbers: 'on',
                tabSize: 4,
              }}
            />
          </div>

          {/* Bottom Execution Console */}
          <div className="h-64 flex flex-col bg-dark-950 border-t border-dark-800">
            
            {/* Console Tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-dark-800 bg-dark-900">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsoleTab('testcases')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    consoleTab === 'testcases'
                      ? 'bg-dark-800 text-white border border-dark-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setConsoleTab('result')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    consoleTab === 'result'
                      ? 'bg-dark-800 text-white border border-dark-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Console Output {runResult && `(${runResult.status})`}
                </button>
              </div>

              {/* Status Indicator */}
              {runResult && (
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span
                    className={`font-bold ${
                      runResult.status === 'Accepted' || runResult.status === 'Success'
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {runResult.status}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{runResult.runtime_ms} ms</span>
                </div>
              )}
            </div>

            {/* Console Tab Content */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
              
              {/* Tab 1: Test Cases */}
              {consoleTab === 'testcases' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {problem.test_cases?.slice(0, 3).map((tc, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedTestCaseIdx(idx); setIsCustomInput(false); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          !isCustomInput && selectedTestCaseIdx === idx
                            ? 'bg-brand-600 text-white'
                            : 'bg-dark-850 text-slate-400 border border-dark-800 hover:text-white'
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setIsCustomInput(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        isCustomInput
                          ? 'bg-cyan-600 text-white'
                          : 'bg-dark-850 text-slate-400 border border-dark-800 hover:text-white'
                      }`}
                    >
                      Custom Input
                    </button>
                  </div>

                  {isCustomInput ? (
                    <div>
                      <span className="text-slate-400 block mb-1 text-[11px]">Enter stdin values:</span>
                      <textarea
                        rows={3}
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="e.g. 2 7 11 15&#10;9"
                        className="w-full p-2.5 rounded-xl bg-dark-900 border border-dark-700 text-slate-200 text-xs focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  ) : (
                    problem.test_cases?.[selectedTestCaseIdx] && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Input:</span>
                          <pre className="p-2.5 rounded-xl bg-dark-900 border border-dark-800 text-slate-200">
                            {problem.test_cases[selectedTestCaseIdx].input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Expected Output:</span>
                          <pre className="p-2.5 rounded-xl bg-dark-900 border border-dark-800 text-emerald-400">
                            {problem.test_cases[selectedTestCaseIdx].expected_output}
                          </pre>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Tab 2: Run Result */}
              {consoleTab === 'result' && (
                <div>
                  {executing || submitting ? (
                    <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2 animate-pulse">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Evaluating code in sandboxed runner...</span>
                    </div>
                  ) : runResult ? (
                    <div className="space-y-3">
                      
                      {/* Test cases breakdown if multiple */}
                      {runResult.test_results && runResult.test_results.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {runResult.test_results.map((tr) => (
                            <div
                              key={tr.test_case_index}
                              className={`p-2.5 rounded-xl border text-xs ${
                                tr.passed
                                  ? 'bg-emerald-500/10 border-emerald-500/30'
                                  : 'bg-rose-500/10 border-rose-500/30'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-200">Test Case {tr.test_case_index}</span>
                                <span className={tr.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                  {tr.status}
                                </span>
                              </div>
                              <div className="mt-1 text-[11px] text-slate-400">
                                <span>Expected: {tr.expected_output}</span> | <span>Actual: {tr.actual_output}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stdout / Stderr logs */}
                      {runResult.stdout && (
                        <div>
                          <span className="text-slate-500 block text-[11px]">STDOUT:</span>
                          <pre className="p-2 rounded-lg bg-dark-900 border border-dark-800 text-slate-300">
                            {runResult.stdout}
                          </pre>
                        </div>
                      )}

                      {runResult.stderr && (
                        <div>
                          <span className="text-rose-400 block text-[11px] font-bold">ERROR LOGS:</span>
                          <pre className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300">
                            {runResult.stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 py-6 text-center font-sans text-xs">
                      Click "Run Code" to test on sample inputs or "Submit Solution" for full evaluation.
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Panel 3: Live AI Coding Skill Coach (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col h-full overflow-hidden bg-slate-950/80">
          <LiveSkillPanel
            scores={scores}
            mistakes={mistakes}
            aiTips={aiTips}
            recommendations={recommendations}
            summary={analysisSummary}
            isAnalyzing={isAnalyzing}
            language={language}
          />
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FUTURISTIC AI CODE REVIEW HUD MODAL                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {reviewModalOpen && submissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-dark-950/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] rounded-3xl glass-panel-glow border border-cyan-500/40 shadow-glow-cyan overflow-y-auto relative">
            
            {/* Cyber scan line */}
            <div className="animate-cyber-scan" />

            {/* ── Modal Header ── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-dark-800">
              <div className="flex items-center gap-4">
                {/* Live 3D AI Orb */}
                <AIMentorOrb3D
                  isThinking={false}
                  size={80}
                  statusText={null}
                />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                      Neural Code Analysis
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      submissionResult.status === 'Accepted'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      {submissionResult.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">AI Code Review & Diagnostic</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Runtime: {submissionResult.runtime_ms} ms
                    {submissionResult.xp_earned ? ` • +${submissionResult.xp_earned} XP earned` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-5 space-y-5">

              {/* ── Metric Cards: Code Quality Score, Time & Space Complexity ── */}
              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                {/* Code Quality Score */}
                <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 shadow-cyber-box flex flex-col items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-400 mb-1" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Code Rating</span>
                  <span className="text-2xl font-black text-white mt-0.5">
                    {submissionResult.ai_feedback?.score ?? 85}
                    <span className="text-sm text-slate-400">/100</span>
                  </span>
                </div>

                {/* Time Complexity */}
                <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 shadow-glow-emerald flex flex-col items-center justify-center">
                  <Timer className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Time Complexity</span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 truncate w-full text-center">
                    {submissionResult.ai_feedback?.time_complexity || 'O(n)'}
                  </span>
                </div>

                {/* Space Complexity */}
                <div className="p-4 rounded-2xl glass-panel border border-purple-500/30 flex flex-col items-center justify-center">
                  <HardDrive className="w-5 h-5 text-purple-400 mb-1" />
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Space Complexity</span>
                  <span className="text-base font-black text-purple-400 mt-0.5 truncate w-full text-center">
                    {submissionResult.ai_feedback?.space_complexity || 'O(n)'}
                  </span>
                </div>
              </div>

              {/* ── Solution Logic Analysis ── */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  Solution Logic Analysis
                </h4>
                <div className="p-4 rounded-2xl bg-dark-900/90 border border-dark-700 text-xs text-slate-200">
                  <MarkdownRenderer content={submissionResult.ai_feedback?.logic_explanation} />
                </div>
              </div>

              {/* ── Optimal Approach Recommendation ── */}
              {submissionResult.ai_feedback?.better_approach && (
                <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/40">
                  <h4 className="text-xs font-mono font-bold text-brand-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    Recommended Optimal Approach
                  </h4>
                  <div className="text-xs text-slate-200">
                    <MarkdownRenderer content={submissionResult.ai_feedback.better_approach} />
                  </div>
                </div>
              )}

              {/* ── Pedagogical Hints ── */}
              {submissionResult.ai_feedback?.hints && submissionResult.ai_feedback.hints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Mentor Learning Hints
                  </h4>
                  <ul className="space-y-1.5">
                    {submissionResult.ai_feedback.hints.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <span className="text-amber-400 font-bold flex-shrink-0 font-mono">{i + 1}.</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Badge Unlocked Notification ── */}
              {submissionResult.new_badges && submissionResult.new_badges.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-300 block">Achievement Unlocked!</span>
                    <span className="text-xs text-amber-200">{submissionResult.new_badges.join(', ')}</span>
                  </div>
                  <Zap className="w-5 h-5 text-amber-400 animate-bounce ml-auto" />
                </div>
              )}

              {/* ── Footer Action ── */}
              <div className="flex items-center justify-between pt-1 border-t border-dark-800">
                <span className="text-xs text-slate-500 font-mono">Powered by CodeMentor AI Neural Engine</span>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-brand-600 hover:from-cyan-400 hover:to-brand-500 text-white text-xs font-black shadow-glow-cyan transition-all hover:scale-105"
                >
                  Continue Coding
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* AI Mentor Slide-Out Drawer */}
      {mentorDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMentorDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-dark-950/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-dark-900 border-l border-dark-700 shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-glow-brand">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block leading-tight">CodeMentor AI</span>
                  <span className="text-[10px] font-mono text-cyan-400">Contextual Tutor</span>
                </div>
              </div>
              <button
                onClick={() => setMentorDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-dark-850/90 border border-dark-800 text-slate-300 shadow-inner">
                {mentorLoading ? (
                  <div className="flex items-center gap-2 text-cyan-400 py-4 justify-center">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Analyzing your code & constraints...</span>
                  </div>
                ) : mentorReply ? (
                  <MarkdownRenderer content={mentorReply} />
                ) : (
                  <p className="leading-relaxed">
                    👋 Hi! I am your CodeMentor tutor for <strong className="text-white">{problem.title}</strong>. Ask me to inspect your loop invariants, provide a nudge without spoiling the full solution, or suggest an optimal approach!
                  </p>
                )}
              </div>
            </div>

            <div className="p-3.5 border-t border-dark-800 bg-dark-950">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={mentorQuestion}
                  onChange={(e) => setMentorQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskMentor()}
                  placeholder="Ask about edge cases, complexity..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-dark-850 border border-dark-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  onClick={() => handleAskMentor()}
                  disabled={mentorLoading || !mentorQuestion.trim()}
                  className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-all disabled:opacity-40 disabled:hover:bg-brand-600 shadow-glow-brand"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default ProblemEditorPage;
