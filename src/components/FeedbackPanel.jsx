import React, { useState, useEffect, useRef } from 'react';
import { Clock, Save, Play, Pause, Trash2, Download, MessageSquare, TrendingUp, Target, Award } from 'lucide-react';

const FeedbackPanel = ({ 
  feedbackHistory, 
  isRecording, 
  onStartRecording, 
  onStopRecording,
  onSaveFeedback,
  onClearHistory 
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const feedbackEndRef = useRef(null);

  // Auto-scroll to bottom when new feedback is added
  useEffect(() => {
    feedbackEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedbackHistory]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '00:00';
    const duration = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get performance level color
  const getPerformanceColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'needs_improvement': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get performance level icon
  const getPerformanceIcon = (level) => {
    switch (level) {
      case 'excellent': return <Award className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'fair': return <Target className="w-4 h-4" />;
      case 'needs_improvement': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Export feedback as JSON
  const exportFeedback = () => {
    const dataStr = JSON.stringify(feedbackHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feedback-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
            Feedback History
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={isRecording ? onStopRecording : onStartRecording}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isRecording 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isRecording ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isRecording ? 'Stop' : 'Record'}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onSaveFeedback}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
            <button
              onClick={exportFeedback}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
            <button
              onClick={onClearHistory}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {feedbackHistory.length} feedback entries
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96" style={{ maxHeight: '400px' }}>
        {feedbackHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No feedback yet. Start a session to see AI responses!</p>
          </div>
        ) : (
          feedbackHistory.map((feedback, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedFeedback === index 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => setSelectedFeedback(selectedFeedback === index ? null : index)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formatTimestamp(feedback.timestamp)}
                  </span>
                  {feedback.duration && (
                    <span className="text-xs text-gray-400">
                      ({formatDuration(feedback.startTime, feedback.endTime)})
                    </span>
                  )}
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(feedback.performanceLevel)}`}>
                  {getPerformanceIcon(feedback.performanceLevel)}
                  <span className="capitalize">{feedback.performanceLevel}</span>
                </div>
              </div>

              {/* Message */}
              <div className="mb-3">
                <p className="text-gray-800 leading-relaxed">{feedback.message}</p>
              </div>

              {/* Analysis Summary */}
              {feedback.analysis && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {feedback.analysis.overallScore && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Overall:</span>
                      <span className="font-medium">{feedback.analysis.overallScore}%</span>
                    </div>
                  )}
                  {feedback.analysis.posture && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Posture:</span>
                      <span className="font-medium">{feedback.analysis.posture.score}%</span>
                    </div>
                  )}
                  {feedback.analysis.confidence && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Confidence:</span>
                      <span className="font-medium">{feedback.analysis.confidence.score}%</span>
                    </div>
                  )}
                  {feedback.analysis.engagement && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Engagement:</span>
                      <span className="font-medium">{feedback.analysis.engagement.score}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Areas to Improve */}
              {feedback.areasToImprove && feedback.areasToImprove.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2">Areas to Improve:</p>
                  <div className="space-y-1">
                    {feedback.areasToImprove.slice(0, 2).map((area, idx) => (
                      <div key={idx} className="text-xs text-gray-500">
                        • {area.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2">Strengths:</p>
                  <div className="space-y-1">
                    {feedback.strengths.slice(0, 2).map((strength, idx) => (
                      <div key={idx} className="text-xs text-green-600">
                        ✓ {strength.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={feedbackEndRef} />
      </div>

      {/* Summary Stats */}
      {feedbackHistory.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-800">
                {feedbackHistory.length}
              </div>
              <div className="text-xs text-gray-500">Total Feedback</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {feedbackHistory.filter(f => f.performanceLevel === 'excellent' || f.performanceLevel === 'good').length}
              </div>
              <div className="text-xs text-gray-500">Positive</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {feedbackHistory.length > 0 ? Math.round(feedbackHistory.reduce((acc, f) => acc + (f.analysis?.overallScore || 0), 0) / feedbackHistory.length) : 0}%
              </div>
              <div className="text-xs text-gray-500">Avg Score</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;
