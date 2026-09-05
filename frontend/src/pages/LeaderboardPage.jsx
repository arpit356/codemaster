import React, { useState, useEffect } from 'react';
import { gamificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Flame, 
  Target, 
  Award, 
  Medal, 
  Crown,
  Sparkles
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/BadgeIcon';

const LeaderboardPage = () => {
  const { user: currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await gamificationAPI.getLeaderboard();
        setLeaderboard(res.data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <LoadingSpinner text="Retrieving global community standings..." />;

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300 fill-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600 fill-amber-600" />;
    return <span className="font-mono text-xs font-bold text-slate-500">#{rank}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold mb-3">
          <Trophy className="w-3.5 h-3.5" />
          <span>Global Developer Rankings</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Community Leaderboard
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Ranked by total algorithmic experience points (XP), streak consistency, and problems conquered.
        </p>
      </div>

      {/* Leaderboard Table Card */}
      <div className="glass-panel rounded-3xl border border-dark-700 shadow-2xl overflow-hidden">
        <div className="divide-y divide-dark-800">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-3.5 bg-dark-950/80 text-[11px] font-mono uppercase text-slate-400 font-bold tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">Coder</div>
            <div className="col-span-2 text-center">Level</div>
            <div className="col-span-2 text-center">Streak</div>
            <div className="col-span-2 text-right">XP</div>
          </div>

          {/* Rows */}
          {leaderboard.map((item) => {
            const isMe = currentUser?.id === item.id;
            return (
              <div
                key={item.id}
                className={`grid grid-cols-12 items-center px-6 py-4 transition-colors ${
                  isMe ? 'bg-brand-600/15 border-l-4 border-brand-500' : 'hover:bg-dark-850/50'
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex justify-center">
                  {getRankBadge(item.rank)}
                </div>

                {/* User Info */}
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <img
                    src={item.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                    alt={item.username}
                    className="w-10 h-10 rounded-xl bg-dark-800 object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">
                        {item.username}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500 text-white font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400 block truncate">
                      {item.skill_level} • {item.problems_solved} solved
                    </span>
                  </div>
                </div>

                {/* Level */}
                <div className="col-span-2 text-center">
                  <span className="text-xs font-mono font-bold text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
                    Lv. {item.level}
                  </span>
                </div>

                {/* Streak */}
                <div className="col-span-2 flex items-center justify-center gap-1 text-xs font-mono text-amber-400 font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{item.streak}d</span>
                </div>

                {/* Total XP */}
                <div className="col-span-2 text-right">
                  <span className="text-sm font-black font-mono text-cyan-400">
                    {item.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
};

export default LeaderboardPage;
