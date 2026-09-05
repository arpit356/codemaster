import React, { useState, useEffect } from 'react';
import { adminAPI, problemsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit, 
  Users, 
  Code2, 
  Activity, 
  CheckCircle2, 
  Search,
  X,
  AlertCircle
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/BadgeIcon';

const ALL_TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Stacks", "Queues", "Recursion", "Trees", "Graphs", "Dynamic Programming"
];

const AdminPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Problem Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    topic: 'Arrays',
    difficulty: 'Easy',
    description: '',
    input_format: 'Single line with input values.',
    output_format: 'Single line output value.',
    constraints: '1 <= n <= 10^5',
    examples: [{ input: '1 2 3', output: '6', explanation: 'Sum of elements is 6.' }],
    test_cases: [
      { input: '1 2 3', expected_output: '6', is_hidden: false },
      { input: '10 20', expected_output: '30', is_hidden: true }
    ],
    starter_codes: {
      python: "import sys\n\ndef solve():\n    # Write code here\n    pass\n\nif __name__ == '__main__':\n    solve()\n",
      cpp: "#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}\n",
      java: "public class Main {\n    public static void main(String[] args) {\n    }\n}\n",
      c: "#include <stdio.h>\nint main() {\n    return 0;\n}\n"
    },
    hints: ["Think about optimal data structures."]
  });

  const fetchData = async () => {
    try {
      const [statsRes, probsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        problemsAPI.getProblems({ limit: 100 }),
        adminAPI.getUsers({ limit: 50 }),
      ]);
      setStats(statsRes.data);
      setProblems(probsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteProblem = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete problem "${title}"?`)) {
      try {
        await adminAPI.deleteProblem(id);
        fetchData();
      } catch (err) {
        alert('Failed to delete problem.');
      }
    }
  };

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      await adminAPI.createProblem(formData);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Failed to create problem.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to admin telemetry..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Superuser Control Panel
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            System Administration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage problems, verify test cases, inspect telemetry, and oversee users.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Problem</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-dark-700">
          <span className="text-xs font-mono text-slate-400 uppercase block">Registered Users</span>
          <span className="text-3xl font-black text-white mt-1 block">{stats?.total_users || 0}</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-dark-700">
          <span className="text-xs font-mono text-slate-400 uppercase block">Total Problems</span>
          <span className="text-3xl font-black text-white mt-1 block">{stats?.total_problems || 0}</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-dark-700">
          <span className="text-xs font-mono text-slate-400 uppercase block">Total Submissions</span>
          <span className="text-3xl font-black text-white mt-1 block">{stats?.total_submissions || 0}</span>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-dark-700">
          <span className="text-xs font-mono text-slate-400 uppercase block">Acceptance Rate</span>
          <span className="text-3xl font-black text-emerald-400 mt-1 block">
            {stats?.overall_acceptance_rate || 0}%
          </span>
        </div>
      </div>

      {/* Problems Management Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-dark-700 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            Problem Repository ({problems.length})
          </h2>
        </div>

        <div className="divide-y divide-dark-800">
          {problems.map((p) => (
            <div key={p.id} className="py-3.5 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <span className="font-bold text-sm text-white">{p.title}</span>
                <div className="flex items-center gap-2 text-slate-400 font-mono">
                  <span>{p.topic}</span>
                  <span>•</span>
                  <span
                    className={
                      p.difficulty === 'Easy'
                        ? 'text-emerald-400'
                        : p.difficulty === 'Medium'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }
                  >
                    {p.difficulty}
                  </span>
                  <span>•</span>
                  <span>slug: {p.slug}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteProblem(p.id, p.title)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-dark-850 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Management Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-dark-700 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-400" />
          Active Users ({users.length})
        </h2>

        <div className="divide-y divide-dark-800">
          {users.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center font-bold text-slate-300">
                  {u.username[0].toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-slate-200 block">{u.username}</span>
                  <span className="text-slate-500 font-mono">{u.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono">
                <span className="text-slate-400">Lv.{u.level}</span>
                <span className="text-cyan-400">{u.xp} XP</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-dark-800 text-slate-400'
                  }`}
                >
                  {u.role.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Problem Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-dark-900 border border-dark-700 shadow-2xl overflow-y-auto p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-dark-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Coding Problem</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateProblem} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Problem Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setFormData({ ...formData, title, slug });
                    }}
                    placeholder="e.g. Valid Anagram"
                    className="w-full px-3 py-2 rounded-xl bg-dark-850 border border-dark-700 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-850 border border-dark-700 text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Topic</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-850 border border-dark-700 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                  >
                    {ALL_TOPICS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-850 border border-dark-700 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Problem details, problem explanation..."
                  className="w-full p-2.5 rounded-xl bg-dark-850 border border-dark-700 text-white text-xs focus:outline-none focus:border-brand-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Input Format</label>
                  <input
                    type="text"
                    value={formData.input_format}
                    onChange={(e) => setFormData({ ...formData, input_format: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-850 border border-dark-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Output Format</label>
                  <input
                    type="text"
                    value={formData.output_format}
                    onChange={(e) => setFormData({ ...formData, output_format: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-dark-850 border border-dark-700 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-dark-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand"
                >
                  {modalLoading ? 'Saving...' : 'Save Problem'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;
