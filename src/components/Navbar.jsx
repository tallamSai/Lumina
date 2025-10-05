import { Link, useLocation } from 'react-router-dom';
import { Video, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import ShinyText from '../pages/ShinyText.jsx';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const hoverSoundRef = useRef(null);
  const clickSoundRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    
    // Initialize audio elements with your sound files
    hoverSoundRef.current = new Audio('/sounds/minimalist-button-hover-sound-effect-399749.mp3');
    clickSoundRef.current = new Audio('/sounds/click-button-131479.mp3');
    
    // Increased volume for better audibility
    hoverSoundRef.current.volume = 0.6;
    clickSoundRef.current.volume = 0.7;
    
    return () => unsub();
  }, []);

  const playHoverSound = () => {
    if (hoverSoundRef.current) {
      hoverSoundRef.current.currentTime = 0;
      hoverSoundRef.current.play().catch(e => console.log('Hover sound failed:', e));
    }
  };

  const playClickSound = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(e => console.log('Click sound failed:', e));
    }
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      <div className="relative">
        {/* Enhanced blue glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        
        {/* Main navbar capsule with enhanced glassmorphism */}
        <div className="relative bg-white/30 backdrop-blur-3xl border border-white/40 rounded-full px-6 py-3 shadow-[0_8px_32px_0_rgba(59,130,246,0.2),0_2px_8px_0_rgba(0,0,0,0.05),inset_0_1px_1px_0_rgba(255,255,255,0.8)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/40 before:via-white/20 before:to-transparent before:opacity-70">
          <div className="flex items-center justify-between relative z-10">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group"
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-xl shadow-lg">
                  <Video className="text-white" size={22} />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">
                  Lumina
                </h1>
                <div className="flex items-center gap-1 text-[10px] text-gray-700">
                  <Sparkles size={9} className="text-cyan-500" />
                  <span>AI-Powered Coaching</span>
                </div>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1.5">
              <Link
                to="/"
                className={`relative px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                  isActive('/')
                    ? 'text-white bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                    : 'text-gray-800 hover:text-gray-900 hover:bg-white/40 hover:backdrop-blur-xl'
                }`}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
              >
                {isActive('/') && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] backdrop-blur-xl"></div>
                )}
                <span className="relative">Home</span>
              </Link>

              <Link
                to="/analyze"
                className={`relative px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                  isActive('/analyze')
                    ? 'text-white bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                    : 'text-gray-800 hover:text-gray-900 hover:bg-white/40 hover:backdrop-blur-xl'
                }`}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
              >
                {isActive('/analyze') && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] backdrop-blur-xl"></div>
                )}
                <span className="relative">Analyze</span>
              </Link>

              <Link
                to="/dashboard"
                className={`relative px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                  isActive('/dashboard')
                    ? 'text-white bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                    : 'text-gray-800 hover:text-gray-900 hover:bg-white/40 hover:backdrop-blur-xl'
                }`}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
              >
                {isActive('/dashboard') && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] backdrop-blur-xl"></div>
                )}
                <span className="relative">Dashboard</span>
              </Link>

              <Link
                to="/ai-interaction"
                className={`relative px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                  isActive('/ai-interaction')
                    ? 'text-white bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30'
                    : 'text-gray-800 hover:text-gray-900 hover:bg-white/40 hover:backdrop-blur-xl'
                }`}
                onMouseEnter={playHoverSound}
                onClick={playClickSound}
              >
                {isActive('/ai-interaction') && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] backdrop-blur-xl"></div>
                )}
                <span className="relative">AI Companion</span>
              </Link>

              {!user ? (
                <Link
                  to="/signin"
                  className="relative px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105"
                  onMouseEnter={playHoverSound}
                  onClick={playClickSound}
                >
                  Sign in
                </Link>
              ) : (
                <button
                  onClick={() => {
                    playClickSound();
                    signOut(auth);
                  }}
                  onMouseEnter={playHoverSound}
                  className="relative px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 text-gray-800 hover:text-red-600 hover:bg-white/40 hover:backdrop-blur-xl"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}