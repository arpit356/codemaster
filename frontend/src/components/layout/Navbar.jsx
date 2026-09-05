import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Code2, 
  Flame, 
  Award, 
  Brain, 
  Compass, 
  LayoutDashboard, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X,
  Sparkles,
  Trophy,
  Home,
  LogIn,
  Zap,
  Terminal
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout, demoLogin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setProfileDropdown(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
    };
    if (profileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Practice', path: '/problems', icon: Code2 },
    { name: 'Playground', path: '/playground', icon: Terminal },
    { name: 'Skill Analysis', path: '/assessment', icon: Brain },
    { name: 'Learning Path', path: '/roadmap', icon: Compass },
    { name: 'AI Mentor', path: '/mentor', icon: Sparkles },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-2 sm:top-3 z-50 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full transition-all duration-300">
      <nav className="glass-panel-glow rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 border border-cyan-500/25 shadow-cyber-box backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          
          {/* CodeMentor AI Logo */}
          <Link to="/" className="flex items-center gap-2.5 group select-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-glow-cyan group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-400">
                CodeMentor<span className="text-cyan-400 font-mono">.AI</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest uppercase text-cyan-400/80 -mt-1 hidden xs:block">
                Futuristic Coding Engine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group ${
                    active
                      ? 'text-white bg-cyan-500/15 border border-cyan-500/40 shadow-glow-cyan'
                      : 'text-slate-300 hover:text-white hover:bg-dark-850/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${active ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
                  <span>{link.name}</span>
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Status / Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {/* Streak Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="font-mono">{user?.streak || 0}d</span>
                </div>

                {/* Level Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono">Lv.{user?.level || 1}</span>
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdown(!profileDropdown)}
                    className="flex items-center gap-2 p-1 rounded-xl border border-dark-700 bg-dark-850/90 hover:border-cyan-500/50 transition-all"
                  >
                    <img
                      src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
                      alt="Avatar"
                      className="w-7 h-7 rounded-lg bg-dark-800 object-cover"
                    />
                    <span className="text-xs font-semibold text-slate-200 pr-1 max-w-[90px] truncate">{user?.username}</span>
                  </button>

                  {profileDropdown && (
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-dark-900/95 border border-cyan-500/30 shadow-2xl py-2 z-50 backdrop-blur-xl animate-in fade-in">
                      <div className="px-4 py-2 border-b border-dark-800">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-bold text-white truncate">{user?.username}</p>
                      </div>

                      <div className="py-1 text-xs">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-dark-800"
                        >
                          <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-dark-800"
                        >
                          <UserIcon className="w-4 h-4 text-brand-400" />
                          Profile Settings
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-amber-400 hover:bg-dark-800 font-medium"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-dark-800 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-dark-850/80 border border-dark-700 hover:border-cyan-500/40 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-brand-600 hover:from-cyan-400 hover:to-brand-500 shadow-glow-cyan transition-all hover:scale-105"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated && (
              <div className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Flame className="w-3.5 h-3.5" />
                <span>{user?.streak || 0}d</span>
              </div>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-dark-850 border border-dark-700 focus:outline-none"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-dark-800 space-y-1 animate-in fade-in">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'text-white bg-cyan-500/20 border border-cyan-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-dark-850'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-dark-800 flex items-center justify-between gap-2">
              {isAuthenticated ? (
                <div className="flex items-center justify-between w-full pt-1">
                  <span className="text-xs text-slate-400 font-mono">Logged as {user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full pt-1">
                  <Link
                    to="/login"
                    className="flex-1 py-2 text-center rounded-xl bg-dark-850 border border-dark-700 text-xs font-semibold text-slate-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 py-2 text-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs shadow-glow-cyan"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

      </nav>
    </header>
  );
};

export default Navbar;
