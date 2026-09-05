import React, { useState, useEffect, useRef } from 'react';
import { mentorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AIMentorOrb3D from '../components/3d/AIMentorOrb3D';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  User, 
  Lightbulb,
  Code2,
  Bug,
  Compass,
  Zap,
  HelpCircle,
  Clock
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/BadgeIcon';

const MentorChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const actionCategories = [
    { label: "Code Explanation", prompt: "Explain the Sliding Window algorithmic pattern with a clean code example", icon: Code2, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    { label: "Error Analysis", prompt: "How do I debug infinite recursion and stack overflow in Depth-First Search?", icon: Bug, color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
    { label: "Coding Hints", prompt: "Give me a gentle pedagogical hint for Two Sum without spoiling the hashmap solution", icon: Lightbulb, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    { label: "Learning Recommendations", prompt: "Based on my current diagnostic score, what specific algorithmic topic should I study next?", icon: Compass, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  ];

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await mentorAPI.getHistory();
        if (res.data && res.data.length > 0) {
          setMessages(res.data);
        } else {
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `Greetings, ${user?.username || 'Architect'}. 👋 I am **CodeMentor**, your digital AI tutor and algorithmic guide.\n\nI am powered by deep heuristic analysis to help you:\n- **Explain Code & Algorithms** with Big-O intuition\n- **Analyze Errors & Edge Cases** in Python, C++, Java, and C\n- **Provide Progressive Hints** without spoiling solutions\n- **Prescribe Next Topics** based on your diagnostic\n\nHow can I empower your coding journey today?`,
              created_at: new Date().toISOString()
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customText = null) => {
    const text = customText || input;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await mentorAPI.chat(text);
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.reply,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: "I experienced a brief disruption in my algorithmic neural link. Please verify your connection or try asking again.",
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear tutoring chat session?')) {
      try {
        await mentorAPI.clearHistory();
        setMessages([
          {
            id: 'cleared',
            role: 'assistant',
            content: 'Neural session reset. Ready for your next algorithm or debugging challenge!',
            created_at: new Date().toISOString()
          }
        ]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (initialLoading) return <LoadingSpinner text="Synchronizing AI Mentor neural matrix..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Holographic Digital Assistant Showcase Banner */}
      <div className="p-6 rounded-3xl glass-panel-glow border border-cyan-500/30 shadow-cyber-box flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* 3D Holographic AI Orb */}
          <AIMentorOrb3D 
            isThinking={loading} 
            size={130} 
            statusText={loading ? 'Synthesizing Advice...' : 'CodeMentor AI Active'} 
          />
          
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Interactive AI Coding Mentor
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Your Autonomous Algorithm Coach
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Ask deep questions about time/space complexity, obtain non-spoiler hints, review logic bugs, and learn how to optimize your code.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-dark-850 border border-dark-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-mono transition-colors"
          title="Reset Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Quick Action Chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actionCategories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <button
              key={i}
              onClick={() => handleSendMessage(cat.prompt)}
              disabled={loading}
              className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${cat.color} hover:bg-opacity-20 flex flex-col justify-between`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold text-white truncate">{cat.label}</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                "{cat.prompt}"
              </p>
            </button>
          );
        })}
      </div>

      {/* Futuristic Chat Window */}
      <div className="rounded-3xl glass-panel border border-cyan-500/25 shadow-cyber-box flex flex-col h-[560px] overflow-hidden">
        
        {/* Messages Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-glow-cyan">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-none'
                      : 'bg-dark-900/90 border border-dark-700 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <MarkdownRenderer content={msg.content} />
                  <span className={`text-[9px] font-mono block mt-2 ${isUser ? 'text-brand-200 text-right' : 'text-slate-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center flex-shrink-0 text-brand-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-dark-900/90 border border-dark-700 text-cyan-400 text-xs font-mono flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>CodeMentor AI is calculating complexity and formulation...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 sm:p-4 border-t border-dark-800 bg-dark-950/80 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CodeMentor about logic, Big-O, edge cases, or what to learn next..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-2xl bg-dark-850 border border-dark-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-dark-950 font-black text-xs sm:text-sm shadow-glow-cyan transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default MentorChatPage;
