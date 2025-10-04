import { Link, useLocation } from 'react-router-dom';
import { Video, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-slate-900/70 backdrop-blur-xl border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur-md opacity-40 group-hover:opacity-70 transition"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg shadow-md">
              <Video className="text-white" size={24} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">SpeakCoach AI</h1>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Sparkles size={10} />
              <span>AI-Powered Coaching</span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-1 py-1 backdrop-blur">
          <Link
            to="/"
            className={`relative px-4 py-2 rounded-full font-medium transition-all ${
              isActive('/')
                ? 'text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isActive('/') && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/25 to-cyan-500/25 rounded-full border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.25)]"></div>
            )}
            <span className="relative">Home</span>
          </Link>

          <Link
            to="/analyze"
            className={`relative px-4 py-2 rounded-full font-medium transition-all ${
              isActive('/analyze')
                ? 'text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isActive('/analyze') && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/25 to-cyan-500/25 rounded-full border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.25)]"></div>
            )}
            <span className="relative">Analyze</span>
          </Link>

          <Link
            to="/dashboard"
            className={`relative px-4 py-2 rounded-full font-medium transition-all ${
              isActive('/dashboard')
                ? 'text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {isActive('/dashboard') && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/25 to-cyan-500/25 rounded-full border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.25)]"></div>
            )}
            <span className="relative">Dashboard</span>
          </Link>

          {!user ? (
            <Link
              to="/signin"
              className="relative px-4 py-2 rounded-full font-semibold transition-all text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              Sign in
            </Link>
          ) : (
            <button
              onClick={() => signOut(auth)}
              className="relative px-4 py-2 rounded-full font-medium transition-all text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
