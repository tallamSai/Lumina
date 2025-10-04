import { Link } from 'react-router-dom';
import { Video, ChartBar as BarChart3, TrendingUp, Zap, ArrowRight, Star, Users, Award } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900/0 to-slate-950/0"></div>

      <Navbar />

      <main className="relative max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-6">
              <Star size={16} className="fill-blue-400" />
              <span>AI-Powered Presentation Coaching</span>
            </div>

            <h2 className="text-7xl font-bold text-white mb-6 leading-tight">
              Master Your
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 text-transparent bg-clip-text">
                Presentation Skills
              </span>
            </h2>

            <p className="text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
              Transform your public speaking with AI analysis. Get instant feedback on voice, body language, and delivery to become a confident presenter.
            </p>

            <div className="flex items-center gap-4">
              <Link
                to="/analyze"
                className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                <span>Start Analysis</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white font-semibold px-8 py-4 rounded-xl transition-all backdrop-blur-sm"
              >
                <span>View Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-12 text-slate-400">
              <div className="flex items-center gap-2">
                <Users size={20} />
                <span className="text-sm">1000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={20} />
                <span className="text-sm">10k+ Analyses</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={20} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm">4.9/5 Rating</span>
              </div>
            </div>
          </div>


        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-24">
          <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Video className="text-blue-400" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Video Analysis</h3>
              <p className="text-slate-400 leading-relaxed">
                Record or upload your presentation. Our AI analyzes every aspect of your delivery in real-time.
              </p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all hover:shadow-xl hover:shadow-cyan-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BarChart3 className="text-cyan-400" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Detailed Insights</h3>
              <p className="text-slate-400 leading-relaxed">
                Get comprehensive scores on voice clarity, body language, pacing, and confidence levels.
              </p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-teal-500/50 transition-all hover:shadow-xl hover:shadow-teal-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="text-teal-400" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Track Progress</h3>
              <p className="text-slate-400 leading-relaxed">
                Monitor your improvement over time with detailed reports and actionable recommendations.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-24 overflow-hidden bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-blue-500/20 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-2xl mb-6">
              <Zap className="text-yellow-400" size={48} />
            </div>
            <h3 className="text-4xl font-bold text-white mb-4">Instant AI Feedback</h3>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Our advanced AI analyzes your voice tone, speech patterns, body language, and presentation flow to provide personalized coaching tips.
            </p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-bold px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              <span>Try It Free</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </main>

      <footer className="relative mt-32 py-8 border-t border-slate-800 text-center text-slate-500">
        <p>&copy; 2025 SpeakCoach AI. Elevate your presentation skills.</p>
      </footer>
    </div>
  );
}