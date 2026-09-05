import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-2xl bg-dark-950/90 border border-dark-700/80 overflow-hidden shadow-lg font-mono text-xs">
      <div className="px-4 py-2 bg-dark-900/90 border-b border-dark-800 flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-slate-200 overflow-x-auto leading-relaxed whitespace-pre font-mono">
        {code}
      </pre>
    </div>
  );
};

const MarkdownTable = ({ rows }) => {
  if (!rows || rows.length === 0) return null;

  // Filter out separator rows like |---|---|
  const cleanRows = rows.filter(r => !/^\s*\|?\s*[-:]+[-| :]*\s*\|?\s*$/.test(r));
  if (cleanRows.length === 0) return null;

  const parseCells = (row) => {
    let raw = row.trim();
    if (raw.startsWith('|')) raw = raw.slice(1);
    if (raw.endsWith('|')) raw = raw.slice(0, -1);
    return raw.split('|').map(c => c.trim());
  };

  const headerCells = parseCells(cleanRows[0]);
  const bodyRows = cleanRows.slice(1).map(parseCells);

  return (
    <div className="my-4 overflow-x-auto rounded-2xl border border-dark-700 bg-dark-950/60 shadow-md">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-dark-900 border-b border-dark-700">
            {headerCells.map((h, i) => (
              <th key={i} className="px-4 py-3 font-bold text-slate-200 tracking-wider font-mono">
                <InlineFormatter text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-800/80">
          {bodyRows.map((r, i) => (
            <tr key={i} className="hover:bg-dark-850/50 transition-colors">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-slate-300">
                  <InlineFormatter text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const InlineFormatter = ({ text }) => {
  if (!text) return null;

  // Tokenize string for bold (**text**), italics (*text*), inline code (`code`)
  const tokens = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded-md bg-dark-900 border border-dark-700 text-cyan-300 font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(
        <strong key={match.index} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(
        <em key={match.index} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    tokens.push(text.slice(lastIdx));
  }

  return <>{tokens}</>;
};

const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by code blocks ```...```
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const sections = content.split(codeBlockRegex);

  return (
    <div className={`space-y-2.5 text-slate-200 text-sm leading-relaxed ${className}`}>
      {sections.map((section, secIdx) => {
        if (!section) return null;

        // Is it a code block?
        if (section.startsWith('```')) {
          const lines = section.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLang = firstLine && !firstLine.includes(' ') && lines.length > 1;
          const language = hasLang ? firstLine : '';
          const code = hasLang ? lines.slice(1).join('\n') : lines.join('\n');
          return <CodeBlock key={secIdx} language={language} code={code} />;
        }

        // Parse lines within text section
        const lines = section.split('\n');
        const elements = [];
        let tableBuffer = [];

        const flushTable = (keyPrefix) => {
          if (tableBuffer.length > 0) {
            elements.push(<MarkdownTable key={`${keyPrefix}-table`} rows={[...tableBuffer]} />);
            tableBuffer = [];
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();

          // Table row detection
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            tableBuffer.push(trimmed);
            continue;
          } else {
            flushTable(`sec-${secIdx}-line-${i}`);
          }

          // Empty line
          if (!trimmed) {
            continue;
          }

          // Headings
          if (trimmed.startsWith('### ')) {
            elements.push(
              <h3 key={i} className="text-base font-bold text-white pt-2.5 pb-1 flex items-center gap-2">
                <InlineFormatter text={trimmed.slice(4)} />
              </h3>
            );
          } else if (trimmed.startsWith('## ')) {
            elements.push(
              <h2 key={i} className="text-lg font-extrabold text-white pt-3 pb-1 border-b border-dark-800">
                <InlineFormatter text={trimmed.slice(3)} />
              </h2>
            );
          } else if (trimmed.startsWith('# ')) {
            elements.push(
              <h1 key={i} className="text-xl font-black text-white pt-3 pb-1">
                <InlineFormatter text={trimmed.slice(2)} />
              </h1>
            );
          }
          // Bullet point
          else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            elements.push(
              <div key={i} className="flex items-start gap-2.5 pl-1 my-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                <span className="text-slate-300">
                  <InlineFormatter text={trimmed.slice(2)} />
                </span>
              </div>
            );
          }
          // Numbered list
          else if (/^\d+\.\s/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
            elements.push(
              <div key={i} className="flex items-start gap-2 pl-1 my-1">
                <span className="font-mono text-xs font-bold text-brand-400 mt-0.5 w-5 flex-shrink-0">
                  {numMatch[1]}.
                </span>
                <span className="text-slate-300">
                  <InlineFormatter text={numMatch[2]} />
                </span>
              </div>
            );
          }
          // Blockquote
          else if (trimmed.startsWith('> ')) {
            elements.push(
              <div key={i} className="p-3 my-2 rounded-xl bg-brand-500/10 border-l-4 border-brand-500 text-slate-300 text-xs italic">
                <InlineFormatter text={trimmed.slice(2)} />
              </div>
            );
          }
          // Regular paragraph
          else {
            elements.push(
              <p key={i} className="leading-relaxed my-1">
                <InlineFormatter text={trimmed} />
              </p>
            );
          }
        }

        flushTable(`sec-${secIdx}-end`);
        return <div key={secIdx}>{elements}</div>;
      })}
    </div>
  );
};

export default MarkdownRenderer;
