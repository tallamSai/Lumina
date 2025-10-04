import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Download, TrendingUp, Calendar, Award, CircleAlert as AlertCircle, Plus, CircleCheck as CheckCircle2, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { cloudinaryStorage } from '../lib/cloudinaryStorage.js';

export default function Dashboard() {
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const ENABLE_CLOUD = import.meta.env.VITE_ENABLE_FIREBASE === 'true';

  const fetchAnalyses = async (user) => {
    if (!user) {
      console.log('No user logged in, clearing analyses');
      setAnalyses([]);
      setSelectedAnalysis(null);
      return;
    }

    console.log('Fetching analyses for user:', user.uid);
    setLoading(true);
    try {
      // Fetch all analyses (both Cloudinary and local)
      console.log('Fetching all user analyses...');
      const allAnalyses = await cloudinaryStorage.getAllUserAnalyses(user.uid);
      
      console.log('Dashboard received analyses:', allAnalyses);
      
      if (allAnalyses && allAnalyses.length > 0) {
        console.log('Found analyses:', allAnalyses.length);
        
        // Debug each analysis
        allAnalyses.forEach((analysis, index) => {
          console.log(`Analysis ${index}:`, {
            id: analysis.analysisId || analysis.id,
            title: analysis.title,
            videoUrl: analysis.videoUrl ? 'Present' : 'Missing',
            videoDataUrl: analysis.videoDataUrl ? 'Present' : 'Missing',
            cloudinary: analysis.cloudinary,
            userId: analysis.userId,
            timestamp: analysis.timestamp
          });
        });
        
        setAnalyses(allAnalyses);
        if (allAnalyses.length > 0 && !selectedAnalysis) {
          setSelectedAnalysis(allAnalyses[0]);
        }
        setLoading(false);
        return;
      } else {
        console.log('No analyses found, attempting sync...');
      }
    } catch (fetchError) {
      console.warn('Analysis fetch failed, attempting sync:', fetchError);
    }

    // If no analyses found, try to sync/recover from Cloudinary
    if (true) { // Try sync always on first fetch
      try {
        console.log('Attempting to sync analyses...');
        const syncedIndex = await cloudinaryStorage.syncUserAnalyses(user.uid);
        
        if (syncedIndex.length > 0) {
          console.log('Successfully synced, retrying fetch...');
          const syncedAnalyses = await cloudinaryStorage.getAllUserAnalyses(user.uid);
          
          if (syncedAnalyses && syncedAnalyses.length > 0) {
            console.log('Found analyses after sync:', syncedAnalyses.length);
            setAnalyses(syncedAnalyses);
            if (syncedAnalyses.length > 0 && !selectedAnalysis) {
              setSelectedAnalysis(syncedAnalyses[0]);
            }
            setLoading(false);
            return;
          }
        }
      } catch (syncError) {
        console.warn('Sync failed:', syncError);
      }
    }

    // No fallbacks - Cloudinary only
    console.log('No analyses found in Cloudinary after sync attempt');
    setAnalyses([]);
    setSelectedAnalysis(null);
    setLoading(false);
  };


  useEffect(() => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, async (user) => {
      await fetchAnalyses(user);
    });
    return () => unsubscribe();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-cyan-400';
    return 'text-orange-400';
  };

  const getScoreBg = (score) => {
    if (score >= 85) return 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50';
    if (score >= 70) return 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/50';
    return 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50';
  };

  const deleteAnalysis = async (analysisId) => {
    const user = auth.currentUser;
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      try {
        await cloudinaryStorage.deleteAnalysis(user.uid, analysisId);
        
        // Remove from local state
        setAnalyses(prev => prev.filter(a => (a.analysisId || a.id) !== analysisId));
        
        // Clear selected analysis if it was deleted
        setSelectedAnalysis(prev => {
          if (prev && (prev.analysisId || prev.id) === analysisId) {
            return null;
          }
          return prev;
        });
        
        console.log(`Analysis ${analysisId} deleted successfully`);
      } catch (error) {
        console.error('Failed to delete analysis:', error);
        alert('Failed to delete analysis. Please try again.');
      }
    }
  };

  const downloadReport = (analysis) => {
    const report = `
PRESENTATION ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}
===================================

TITLE: ${analysis.title}
DATE: ${new Date(analysis.date).toLocaleDateString()}

OVERALL SCORE: ${analysis.overallScore}/100

DETAILED SCORES:
- Voice Clarity: ${analysis.voiceClarity}/100
- Body Language: ${analysis.bodyLanguage}/100
- Pacing: ${analysis.pace}/100
- Confidence: ${analysis.confidence}/100

STRENGTHS:
${analysis.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

AREAS FOR IMPROVEMENT:
${analysis.improvements.map((s, i) => `${i + 1}. ${s}`).join('\n')}

DETAILED FEEDBACK:
${analysis.feedback}

RECOMMENDATIONS:
${analysis.recommendations.map((s, i) => `${i + 1}. ${s}`).join('\n')}

===================================
SpeakCoach AI - Elevate Your Presentation Skills
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/0 to-slate-950/0"></div>

      <Navbar />

      <main className="relative max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-5xl font-bold text-white mb-2">Your Dashboard</h2>
            <p className="text-slate-400 text-lg">Track your progress and review past analyses</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/analyze"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <Plus size={20} />
              New Analysis
            </Link>
          </div>
        </div>

        {analyses.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-16 text-center">
            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-slate-500" size={48} />
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">No Analyses Yet</h3>
            <p className="text-slate-400 text-lg mb-8">Start by recording or uploading a presentation video</p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus size={20} />
              Create First Analysis
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xl font-bold text-white mb-4 px-1">Your Presentations</h3>
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  onClick={() => setSelectedAnalysis(analysis)}
                  className={`relative group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedAnalysis?.id === analysis.id
                      ? 'border-blue-500/50 shadow-lg shadow-blue-500/10'
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  {selectedAnalysis?.id === analysis.id && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl"></div>
                  )}
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-semibold pr-2">{analysis.title}</h4>
                      <div className="flex items-center gap-2">
                        <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)} whitespace-nowrap`}>
                          {analysis.overallScore}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnalysis(analysis.analysisId || analysis.id);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded"
                          title="Delete analysis"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar size={14} />
                        {new Date(analysis.date || analysis.timestamp).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                          Cloudinary
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2">
              {selectedAnalysis ? (
                <div className="space-y-6">
                  <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-3xl font-bold text-white">{selectedAnalysis.title}</h3>
                        <button
                          onClick={() => downloadReport(selectedAnalysis)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-500/25"
                        >
                          <Download size={18} />
                          Download Report
                        </button>
                      </div>

                      <div className={`${getScoreBg(selectedAnalysis.overallScore)} border rounded-2xl p-8 mb-6 text-center`}>
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <Award className={getScoreColor(selectedAnalysis.overallScore)} size={40} />
                          <div className={`text-6xl font-bold ${getScoreColor(selectedAnalysis.overallScore)}`}>
                            {selectedAnalysis.overallScore}
                          </div>
                        </div>
                        <p className="text-slate-400 text-lg">Overall Score</p>
                      </div>

                      {/* Video Preview Section */}
                      {(selectedAnalysis.videoUrl || selectedAnalysis.videoDataUrl) && (
                        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 mb-6">
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Video className="text-blue-400" size={20} />
                            Presentation Video
                            <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">
                              Cloudinary
                            </span>
                          </h4>
                          <div className="relative">
                            <video
                              src={selectedAnalysis.videoUrl || selectedAnalysis.videoDataUrl}
                              controls
                              className="w-full h-64 object-cover rounded-lg bg-slate-900"
                              poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjMTE0MTU0Ii8+CjxwYXRoIGQ9Ik0xMjggMTYwTDE2MCAxNDRMMTI4IDEyOFYxNjBaIiBmaWxsPSIjNjM2NkY3Ii8+Cjwvc3ZnPgo="
                              onError={(e) => {
                                console.log('Video failed to load:', selectedAnalysis.videoUrl || selectedAnalysis.videoDataUrl);
                                console.log('videoUrl:', selectedAnalysis.videoUrl);
                                console.log('videoDataUrl:', selectedAnalysis.videoDataUrl);
                                e.target.style.display = 'none';
                              }}
                              onLoadStart={() => {
                                console.log('Video loading started:', selectedAnalysis.videoUrl || selectedAnalysis.videoDataUrl);
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5">
                          <p className="text-slate-500 text-sm mb-2">Voice Clarity</p>
                          <div className={`text-3xl font-bold ${getScoreColor(selectedAnalysis.voiceClarity)}`}>
                            {selectedAnalysis.voiceClarity}/100
                          </div>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5">
                          <p className="text-slate-500 text-sm mb-2">Body Language</p>
                          <div className={`text-3xl font-bold ${getScoreColor(selectedAnalysis.bodyLanguage)}`}>
                            {selectedAnalysis.bodyLanguage}/100
                          </div>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5">
                          <p className="text-slate-500 text-sm mb-2">Pacing</p>
                          <div className={`text-3xl font-bold ${getScoreColor(selectedAnalysis.pace)}`}>
                            {selectedAnalysis.pace}/100
                          </div>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5">
                          <p className="text-slate-500 text-sm mb-2">Confidence</p>
                          <div className={`text-3xl font-bold ${getScoreColor(selectedAnalysis.confidence)}`}>
                            {selectedAnalysis.confidence}/100
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
                    <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-2 rounded-lg">
                        <CheckCircle2 className="text-green-400" size={24} />
                      </div>
                      Strengths
                    </h4>
                    <ul className="space-y-3 mb-8">
                      {selectedAnalysis.strengths.map((strength, idx) => (
                        <li key={idx} className="text-slate-300 flex items-start gap-3 text-lg">
                          <span className="text-green-400 text-xl mt-0.5">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>

                    <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-2 rounded-lg">
                        <TrendingUp className="text-cyan-400" size={24} />
                      </div>
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-3">
                      {selectedAnalysis.improvements.map((improvement, idx) => (
                        <li key={idx} className="text-slate-300 flex items-start gap-3 text-lg">
                          <span className="text-cyan-400 text-xl mt-0.5">→</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
                    <h4 className="text-2xl font-bold text-white mb-4">Detailed Feedback</h4>
                    <p className="text-slate-300 text-lg leading-relaxed mb-8">{selectedAnalysis.feedback}</p>

                    <h4 className="text-2xl font-bold text-white mb-6">Recommendations</h4>
                    <ul className="space-y-3">
                      {selectedAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-slate-300 flex items-start gap-3 text-lg">
                          <span className="text-blue-400 font-bold mt-0.5">{idx + 1}.</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-16 text-center">
                  <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Video className="text-slate-500" size={48} />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Select a Presentation</h3>
                  <p className="text-slate-400 text-lg">Choose an analysis from the list to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
