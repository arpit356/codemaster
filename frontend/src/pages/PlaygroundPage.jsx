import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Play,
  RotateCcw,
  Terminal,
  Code2,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Keyboard,
} from 'lucide-react';

import { submissionsAPI } from '../services/api';
import useCodeAnalysis from '../hooks/useCodeAnalysis';
import LiveSkillPanel from '../components/editor/LiveSkillPanel';

const LANGUAGE_CONFIGS = {
  python: {
    label: 'Python 3',
    monacoLang: 'python',
    starter: `# CodeMentor AI - Free-Form Coding Playground
# Write any algorithm, function, or experimental code here.
# Live AI skill coach analyzes your syntax, readability & complexity in real-time.

def calculate_fibonacci(n: int) -> list:
    """Generates first n Fibonacci numbers."""
    if n <= 0:
        return []
    fib = [0, 1]
    for _ in range(2, n):
        fib.append(fib[-1] + fib[-2])
    return fib[:n]

if __name__ == "__main__":
    result = calculate_fibonacci(8)
    print("Fibonacci sequence:", result)
`,
  },
  java: {
    label: 'Java 15',
    monacoLang: 'java',
    starter: `// CodeMentor AI - Free-Form Coding Playground
import java.util.ArrayList;
import java.util.List;

public class Solution {
    public static List<Integer> generatePrimes(int limit) {
        List<Integer> primes = new ArrayList<>();
        for (int i = 2; i <= limit; i++) {
            boolean isPrime = true;
            for (int j = 2; j * j <= i; j++) {
                if (i % j == 0) {
                    isPrime = false;
                    break;
                }
            }
            if (isPrime) primes.add(i);
        }
        return primes;
    }

    public static void main(String[] args) {
        System.out.println("Primes up to 30: " + generatePrimes(30));
    }
}
`,
  },
  cpp: {
    label: 'C++ 17',
    monacoLang: 'cpp',
    starter: `// CodeMentor AI - Free-Form Coding Playground
#include <iostream>
#include <vector>

std::vector<int> generateMultiples(int base, int count) {
    std::vector<int> res;
    for (int i = 1; i <= count; ++i) {
        res.push_back(base * i);
    }
    return res;
}

int main() {
    auto multiples = generateMultiples(7, 5);
    std::cout << "Multiples of 7: ";
    for (int num : multiples) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    return 0;
}
`,
  },
  c: {
    label: 'C 11',
    monacoLang: 'c',
    starter: `// CodeMentor AI - Free-Form Coding Playground
#include <stdio.h>

void printFactorial(int n) {
    long long fact = 1;
    for (int i = 1; i <= n; ++i) {
        fact *= i;
    }
    printf("Factorial of %d is %lld\\n", n, fact);
}

int main() {
    printFactorial(6);
    return 0;
}
`,
  },
};

export const PlaygroundPage = () => {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGE_CONFIGS.python.starter);
  const [customInput, setCustomInput] = useState('');
  const [executing, setExecuting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [consoleExpanded, setConsoleExpanded] = useState(false); // false = normal, true = fullscreen console
  const [showStdin, setShowStdin] = useState(false);

  // Live real-time analysis hook for playground mode (no problem statement required)
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
    problemId: null,
    problemTitle: null,
    problemTopic: null,
  });

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(LANGUAGE_CONFIGS[newLang]?.starter || '');
    setRunResult(null);
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code to starter boilerplate? Current changes will be discarded.')) {
      setCode(LANGUAGE_CONFIGS[language]?.starter || '');
    }
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setRunResult(null);
    try {
      const response = await submissionsAPI.runCode(
        code,
        language,
        null, // No problem_id
        customInput || null
      );
      setRunResult(response.data);
    } catch (err) {
      setRunResult({
        status: 'Execution Error',
        stdout: '',
        stderr: err.response?.data?.detail || err.message || 'Failed to execute code on sandbox runner.',
        runtime_ms: 0,
        memory_kb: 0,
      });
    } finally {
      setExecuting(false);
    }
  };

  const isSuccess = runResult?.status === 'Success' || runResult?.status === 'Accepted';

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-slate-950 overflow-hidden">
      {/* Top Controls Header */}
      <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-brand-500/20 border border-cyan-500/30 text-cyan-400 shadow-glow-cyan">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                AI Coding Playground
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wide">
                Free-Form Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Code freely without problem constraints. Live AI skill coach evaluates your syntax &amp; quality in real-time.
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Language selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            {Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleLanguageChange(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  language === key
                    ? 'bg-gradient-to-r from-cyan-500 to-brand-600 text-white shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            title="Reset code template"
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run Code Button */}
          <button
            onClick={handleRunCode}
            disabled={executing}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 hover:scale-105"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${executing ? 'animate-spin' : ''}`} />
            <span>{executing ? 'Executing...' : 'Run Program'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: 2-Panel (Editor 8-col + Live Skill Coach 4-col) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
        {/* Left/Center: Monaco Editor + Interactive Console */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-slate-900 border-r border-slate-800/80 min-h-0">
          
          {/* Monaco Editor Container — takes remaining space */}
          <div className={`${consoleExpanded ? 'hidden' : 'flex-1'} min-h-[180px] relative`}>
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
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
              }}
            />
          </div>

          {/* Output Console Panel — resizable */}
          <div className={`${consoleExpanded ? 'flex-1' : 'h-56'} flex flex-col bg-slate-950 border-t border-cyan-500/20 shadow-2xl shrink-0 transition-all duration-300`}>
            {/* Console Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                  Program Output
                </span>
                {runResult && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1 ${
                    isSuccess
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {runResult.status}
                    {runResult.runtime_ms > 0 && ` · ${runResult.runtime_ms}ms`}
                  </span>
                )}
                {executing && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold bg-amber-500/20 text-amber-300 flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3 animate-spin" />
                    Running...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Toggle stdin input visibility */}
                <button
                  onClick={() => setShowStdin(v => !v)}
                  title="Toggle custom input panel"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    showStdin
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-500 hover:text-slate-300 border border-transparent'
                  }`}
                >
                  <Keyboard className="w-3 h-3" />
                  <span>Stdin</span>
                </button>
                {/* Expand/collapse console */}
                <button
                  onClick={() => setConsoleExpanded(v => !v)}
                  title={consoleExpanded ? 'Restore editor view' : 'Expand output to full panel'}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"
                >
                  {consoleExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Console Content Area */}
            <div className={`flex-1 ${showStdin ? 'grid grid-cols-5' : 'flex flex-col'} overflow-hidden`}>
              
              {/* stdin panel (only when showStdin is true) */}
              {showStdin && (
                <div className="col-span-2 flex flex-col border-r border-slate-800/80 p-3">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                    Custom Input (stdin)
                  </span>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter inputs line-by-line..."
                    className="flex-1 w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs resize-none focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              )}

              {/* stdout / stderr output */}
              <div className={`${showStdin ? 'col-span-3' : 'flex-1'} flex flex-col p-3 overflow-hidden`}>
                <span className="text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  stdout / stderr
                </span>
                <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-800 overflow-y-auto font-mono text-xs">
                  {executing ? (
                    <div className="flex items-center gap-2 text-slate-400 animate-pulse py-4">
                      <Activity className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Executing code in sandbox runner...</span>
                    </div>
                  ) : runResult ? (
                    <div className="space-y-2">
                      {runResult.stdout && (
                        <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">{runResult.stdout}</pre>
                      )}
                      {runResult.stderr && (
                        <div>
                          <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wide mb-1">Error:</div>
                          <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed">{runResult.stderr}</pre>
                        </div>
                      )}
                      {!runResult.stdout && !runResult.stderr && (
                        <span className="text-slate-500 italic">Program executed with no console output.</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-4 space-y-2">
                      <Terminal className="w-8 h-8 text-slate-700" />
                      <span className="text-slate-500 italic text-[11px]">
                        Click <span className="text-emerald-400 font-bold not-italic">"Run Program"</span> to compile and execute your code
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Live AI Coding Skill Coach */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden bg-slate-950">
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
    </div>
  );
};

export default PlaygroundPage;
