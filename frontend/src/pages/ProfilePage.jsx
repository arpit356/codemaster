import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gamificationAPI, submissionsAPI } from '../services/api';
import { BadgeIcon } from '../components/common/BadgeIcon';
import { 
  User, 
  Award, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Mail, 
  Calendar,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/BadgeIcon';

const ProfilePage = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [badgesRes, subsRes] = await Promise.all([
          gamificationAPI.getBadges(),
          submissionsAPI.getUserSubmissions(15),
        ]);
        setBadges(badgesRes.data);
        setSubmissions(subsRes.data);
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  if (loading) return <LoadingSpinner text="Retrieving profile & achievements..." />;

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-dark-900 via-dark-850 to-brand-950/40 border border-dark-700 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
          alt="Avatar"
          className="w-24 h-24 rounded-3xl bg-dark-800 object-cover border-2 border-brand-500/50 shadow-glow-brand"
        />

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{user?.username}</h1>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Level {user?.level || 1} • {user?.skill_level || 'Beginner'}
            </span>
            {user?.role === 'admin' && (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Administrator
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              {user?.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2026'}
            </span>
          </div>

          {/* Quick Stats Pill Row */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{user?.streak || 0} Day Streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold font-mono">
              <Trophy className="w-4 h-4 text-brand-400" />
              <span>{user?.xp || 0} Total XP</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>{unlockedCount} / {badges.length} Badges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badges Showcase */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-dark-700 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Achievement Badges
            </h2>
            <p className="text-xs text-slate-400">Earned through milestones, streaks, and speed</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-300 bg-dark-850 px-3 py-1 rounded-full border border-dark-700">
            {unlockedCount} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                badge.unlocked
                  ? 'bg-dark-900 border-amber-500/30 shadow-md'
                  : 'bg-dark-950/60 border-dark-800 opacity-60'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  badge.unlocked
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-dark-800 text-slate-500'
                }`}
              >
                {badge.unlocked ? (
                  <BadgeIcon iconName={badge.icon} className="w-6 h-6 text-amber-400" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-500" />
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white truncate">{badge.name}</h3>
                  <span className="text-[10px] font-mono font-bold text-brand-400">
                    +{badge.xp_reward} XP
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {badge.description}
                </p>
                {badge.unlocked && badge.awarded_at && (
                  <span className="text-[10px] font-mono text-emerald-400 block pt-1">
                    Unlocked on {new Date(badge.awarded_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submissions History Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-dark-700 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Submission Log
          </h2>
          <p className="text-xs text-slate-400">Detailed historical record of your code runs</p>
        </div>

        <div className="divide-y divide-dark-800">
          {submissions.length > 0 ? (
            submissions.map((sub) => (
              <div key={sub.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200 text-sm block">
                    {sub.problem_title}
                  </span>
                  <span className="text-slate-500 font-mono">
                    {sub.language.toUpperCase()} • {sub.runtime_ms} ms • {new Date(sub.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold px-2.5 py-1 rounded-full text-[11px] ${
                      sub.status === 'Accepted'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No submissions recorded yet.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
