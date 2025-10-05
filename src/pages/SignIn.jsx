import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import Navbar from '../components/Navbar';
import { Sparkles, LogIn, LogOut } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    navigate('/dashboard');
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-white relative">
      {/* Soft glassy background blur */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-200/20 via-white/0 to-gray-100/0"></div>
      
      <Navbar />

      <main className="relative max-w-md mx-auto px-6 pt-32 pb-20">
        <div className="relative bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-2xl blur opacity-40"></div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-600 text-sm font-medium mb-6">
              <Sparkles size={16} />
              <span>Welcome to SpeakCoach AI</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">Sign in to continue</h1>
            <p className="text-gray-600 mb-8">
              Use your Google account to save analyses and sync across devices.
            </p>

            {!user ? (
              <button
                onClick={signInGoogle}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:opacity-90"
              >
                <LogIn size={20} />
                Continue with Google
              </button>
            ) : (
              <button
                onClick={signOutUser}
                className="w-full bg-gray-100 text-gray-800 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-200"
              >
                <LogOut size={20} />
                Sign out {user.displayName ? `(${user.displayName})` : ''}
              </button>
            )}

            {loading && (
              <p className="text-gray-400 text-sm mt-4">Checking session...</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
