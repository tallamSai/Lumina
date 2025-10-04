import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize Gemini AI
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export async function generatePresentationSummary(comprehensiveData) {
  console.log('Gemini API Key available:', !!GEMINI_API_KEY);
  
  if (!GEMINI_API_KEY || !genAI) {
    console.warn('Gemini API key not configured');
    return null;
  }

  try {
    // Extract all real-time analysis data
    const audioData = comprehensiveData.raw?.audio;
    const videoData = comprehensiveData.raw?.video;
    const nlpData = comprehensiveData.raw?.nlp;
    const realTimeMetrics = comprehensiveData.realTimeMetrics || {};

    // Check for content validation
    const audioValid = audioData?.contentValidation?.hasValidContent || false;
    const videoValid = videoData?.contentValidation?.hasValidContent || false;
    
    // If content is insufficient, return appropriate response
    if (!audioValid && !videoValid) {
      return {
        overallScore: 0,
        voiceClarity: 0,
        bodyLanguage: 0,
        pacing: 0,
        confidence: 0,
        summary: "Insufficient content detected for meaningful analysis. Please ensure your video contains clear speech and a visible person.",
        strengths: [],
        areasForImprovement: [
          "No meaningful speech detected",
          "No clear person visible in video",
          "Insufficient content for analysis"
        ],
        speakingTips: [
          "Ensure you are clearly visible in the video",
          "Speak clearly and audibly",
          "Record in a well-lit environment"
        ],
        practiceDrills: [
          "Record a test video with clear speech",
          "Ensure good lighting and camera positioning",
          "Practice speaking clearly and audibly"
        ],
        scoreExplanation: "Scores are 0 because insufficient content was detected for meaningful analysis",
        nextSteps: [
          "Record a new video with clear speech and visible person",
          "Ensure good audio and video quality",
          "Try again with a proper presentation video"
        ],
        technicalNotes: [
          "Audio quality insufficient for analysis",
          "Video content insufficient for pose detection",
          "No meaningful content detected"
        ]
      };
    }

    // Build comprehensive prompt with all actual data
    const prompt = `You are an elite presentation coach and communication expert analyzing a video presentation. Generate comprehensive, dynamic feedback based on the ACTUAL performance metrics provided. Use ONLY the real data provided - no assumptions or fallbacks.

COMPREHENSIVE PERFORMANCE DATA:

AUDIO ANALYSIS (Real-time):
- Volume Average: ${audioData?.audio?.volume?.average || 0}
- Volume Consistency: ${audioData?.audio?.volume?.consistency || 0}%
- Volume Stability: ${audioData?.audio?.volume?.stability || 0}%
- Pitch Average: ${audioData?.audio?.pitch?.average || 0} Hz
- Pitch Stability: ${audioData?.audio?.pitch?.stability || 0}%
- Pitch Variance: ${audioData?.audio?.pitch?.variance || 0}
- Speech Rate: ${audioData?.transcript?.speakingRate || 0} words/min
- Speech Rhythm: ${audioData?.audio?.speech?.rhythm || 0}%
- Speech Segments: ${audioData?.audio?.speech?.segments || 0}
- Silence Percentage: ${audioData?.audio?.silence?.percentage || 0}%
- Quality Clarity: ${audioData?.audio?.quality?.clarity || 0}%
- Quality Consistency: ${audioData?.audio?.quality?.consistency || 0}%

SPEECH RECOGNITION (Real-time):
- Transcript Length: ${audioData?.transcript?.wordCount || 0} words
- Confidence: ${audioData?.transcript?.confidence || 0}%
- Filler Words Count: ${audioData?.transcript?.fillerWords?.count || 0}
- Filler Words Percentage: ${audioData?.transcript?.fillerWords?.percentage || 0}%
- Speaking Rate: ${audioData?.transcript?.speakingRate || 0} words/min
- Word Count: ${audioData?.transcript?.wordCount || 0}
- Pauses Count: ${audioData?.transcript?.pauses?.count || 0}
- Pauses Frequency: ${audioData?.transcript?.pauses?.frequency || 0}

NLP ANALYSIS (Real-time):
- Clarity Score: ${nlpData?.clarity?.score || 0}%
- Structure Score: ${nlpData?.structure?.avgSentenceLength || 0}
- Repetition Score: ${nlpData?.repetition?.repetitionScore || 0}%
- Repeated Words: ${nlpData?.repetition?.repeatedWords?.length || 0}
- Filler Analysis: ${nlpData?.fillerWords?.percentage || 0}%

VIDEO ANALYSIS (Real-time Pose Detection):
- Posture Score: ${videoData?.aggregated?.bodyLanguage?.posture || 0}%
- Gesture Score: ${videoData?.aggregated?.bodyLanguage?.gestures || 0}%
- Eye Contact: ${videoData?.aggregated?.engagement?.eyeContact || 0}%
- Body Presence: ${videoData?.aggregated?.engagement?.overall || 0}%
- Emotion Confidence: ${videoData?.frames?.map(f => f.emotion?.confidence).reduce((a, b) => a + b, 0) / (videoData?.frames?.length || 1) || 0}%

REAL-TIME METRICS:
- Volume Consistency: ${realTimeMetrics.volume?.reduce((a, b) => a + b, 0) / (realTimeMetrics.volume?.length || 1) || 0}%
- Pitch Stability: ${realTimeMetrics.pitch?.reduce((a, b) => a + b, 0) / (realTimeMetrics.pitch?.length || 1) || 0}%
- Clarity: ${realTimeMetrics.clarity?.reduce((a, b) => a + b, 0) / (realTimeMetrics.clarity?.length || 1) || 0}%
- Posture: ${realTimeMetrics.posture?.reduce((a, b) => a + b, 0) / (realTimeMetrics.posture?.length || 1) || 0}%
- Gestures: ${realTimeMetrics.gestures?.reduce((a, b) => a + b, 0) / (realTimeMetrics.gestures?.length || 1) || 0}%

Generate a comprehensive analysis with dynamic scoring (0-100 range) based on these ACTUAL metrics. Be specific about what the presenter did well and what needs improvement. Include advanced insights about presentation psychology, audience engagement, and professional development. Respond with JSON only:

{
  "overallScore": [calculate 0-100 based on all real metrics - be realistic],
  "voiceClarity": [calculate 0-100 based on audio clarity and consistency],
  "bodyLanguage": [calculate 0-100 based on posture, gestures, and presence],
  "pacing": [calculate 0-100 based on speech rate and rhythm],
  "confidence": [calculate 0-100 based on stability and presence metrics],
  "engagement": [calculate 0-100 based on eye contact, gestures, and vocal variety],
  "contentQuality": [calculate 0-100 based on clarity, structure, and repetition],
  "professionalism": [calculate 0-100 based on overall delivery and presence],
  "summary": "[detailed performance analysis with specific observations from real data]",
  "strengths": ["[specific strengths based on actual performance metrics]"],
  "areasForImprovement": ["[specific areas that need work based on real metrics]"],
  "speakingTips": ["[actionable tips based on actual performance]"],
  "practiceDrills": ["[specific exercises to address weaknesses found in analysis]"],
  "scoreExplanation": "[explain how scores were calculated from the actual metrics provided]",
  "nextSteps": ["[prioritized action items based on real performance data]"],
  "technicalNotes": ["[specific technical observations about the actual performance]"],
  "advancedInsights": {
    "presentationStyle": "[analyze the presenter's communication style and approach]",
    "audienceEngagement": "[assess how well the presenter would engage an audience]",
    "improvementPriority": "[rank the most important areas to improve first]",
    "strengthAreas": "[identify the presenter's strongest communication skills]",
    "weaknessAreas": "[identify the most critical areas needing improvement]",
    "coachingFocus": "[suggest specific coaching focus areas]"
  },
  "performanceBreakdown": {
    "opening": "[analyze the first 30 seconds of the presentation]",
    "body": "[analyze the main content delivery]",
    "closing": "[analyze the final 30 seconds]",
    "transitions": "[analyze how well the presenter moves between topics]"
  },
  "recommendations": {
    "immediate": ["[things to fix right away]"],
    "shortTerm": ["[improvements for next week]"],
    "longTerm": ["[development goals for next month]"]
  }
}`;

    // Get the generative model with fallback
    const modelCandidates = ['gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    let model = null;
    
    for (const modelName of modelCandidates) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        console.log(`Using model: ${modelName}`);
        break;
      } catch (error) {
        console.log(`Model ${modelName} not available, trying next...`);
        continue;
      }
    }
    
    if (!model) {
      throw new Error('No working Gemini model found. Please check your API key and available models.');
    }

    console.log('Calling Gemini API with comprehensive data:', comprehensiveData);
    console.log('Raw metrics for AI analysis:', {
      audioData: audioData ? 'Available' : 'Missing',
      videoData: videoData ? 'Available' : 'Missing',
      nlpData: nlpData ? 'Available' : 'Missing',
      realTimeMetrics: realTimeMetrics ? 'Available' : 'Missing'
    });
    
    // Debug: Log actual values being used
    if (audioData?.audio) {
      console.log('Audio metrics:', {
        clarity: audioData.audio.quality?.clarity,
        volumeConsistency: audioData.audio.volume?.consistency,
        pitchStability: audioData.audio.pitch?.stability,
        speechRate: audioData.transcript?.speakingRate,
        fillerWords: audioData.transcript?.fillerWords?.percentage
      });
    }
    
    if (videoData?.aggregated) {
      console.log('Video metrics:', {
        posture: videoData.aggregated.bodyLanguage?.posture,
        gestures: videoData.aggregated.bodyLanguage?.gestures,
        eyeContact: videoData.aggregated.engagement?.eyeContact,
        bodyPresence: videoData.aggregated.engagement?.overall
      });
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      console.error('No text in Gemini response');
      return null;
    }
    
    console.log('Gemini response text:', text);

    // Try to parse JSON response
    try {
      // Look for JSON in the response (handle both ```json and plain JSON)
      let jsonText = text;
      
      // Remove markdown code blocks if present
      if (text.includes('```json')) {
        jsonText = text.split('```json')[1].split('```')[0].trim();
      } else if (text.includes('```')) {
        jsonText = text.split('```')[1].split('```')[0].trim();
      } else {
        // Look for JSON object in the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
      }
      
      const parsed = JSON.parse(jsonText);
      console.log('Parsed JSON from Gemini:', parsed);
      
      // Validate that we have the required fields
      if (parsed.overallScore && parsed.voiceClarity && parsed.bodyLanguage && parsed.pacing && parsed.confidence) {
        return parsed;
      } else {
        console.warn('Incomplete JSON response from Gemini:', parsed);
        // Fall through to dynamic generation
      }
    } catch (parseError) {
      console.warn('Could not parse JSON from Gemini response:', parseError);
    }

    // If no JSON found, create dynamic response based on actual metrics
    console.log('No JSON found, creating dynamic response from comprehensive data');
    
    // Extract and validate actual data - NO FALLBACKS
    const hasAudioData = audioData && audioData.audio;
    const hasVideoData = videoData && videoData.aggregated;
    const hasNlpData = nlpData && nlpData.clarity;
    
    if (!hasAudioData && !hasVideoData) {
      console.warn('Insufficient data for analysis - no audio or video data available');
      return {
        overallScore: 0,
        voiceClarity: 0,
        bodyLanguage: 0,
        pacing: 0,
        confidence: 0,
        summary: "Insufficient data for analysis. Please ensure your video contains clear audio and visible person.",
        strengths: [],
        areasForImprovement: ["No meaningful data detected for analysis"],
        speakingTips: ["Record a new video with clear audio and visible person"],
        practiceDrills: ["Ensure good lighting and audio quality before recording"],
        scoreExplanation: "Scores are 0 because no meaningful data was detected",
        nextSteps: ["Record a new video with clear audio and visible person"],
        technicalNotes: ["Audio analysis failed", "Video analysis failed"]
      };
    }
    
    // Calculate ACTUAL scores from real data - NO FALLBACKS
    const voiceClarity = hasAudioData ? Math.round(audioData.audio.quality?.clarity || 0) : 0;
    const volumeConsistency = hasAudioData ? Math.round(audioData.audio.volume?.consistency || 0) : 0;
    const pitchStability = hasAudioData ? Math.round(audioData.audio.pitch?.stability || 0) : 0;
    const speechRate = hasAudioData ? (audioData.transcript?.speakingRate || 0) : 0;
    const fillerWords = hasAudioData ? (audioData.transcript?.fillerWords?.percentage || 0) : 0;
    
    const posture = hasVideoData ? Math.round(videoData.aggregated.bodyLanguage?.posture || 0) : 0;
    const gestures = hasVideoData ? Math.round(videoData.aggregated.bodyLanguage?.gestures || 0) : 0;
    const eyeContact = hasVideoData ? Math.round(videoData.aggregated.engagement?.eyeContact || 0) : 0;
    const bodyPresence = hasVideoData ? Math.round(videoData.aggregated.engagement?.overall || 0) : 0;
    
    const contentClarity = hasNlpData ? Math.round(nlpData.clarity?.score || 0) : 0;
    const sentenceStructure = hasNlpData ? (nlpData.structure?.avgSentenceLength || 0) : 0;
    const repetition = hasNlpData ? Math.round(nlpData.repetition?.repetitionScore || 0) : 0;
    
    // Calculate dynamic scores based on ACTUAL performance data
    const voiceScore = Math.round((voiceClarity + volumeConsistency + pitchStability) / 3);
    const bodyScore = Math.round((posture + gestures + eyeContact + bodyPresence) / 4);
    const paceScore = speechRate > 0 ? Math.round(Math.max(0, 100 - Math.abs(speechRate - 150) / 2)) : 0;
    const confidenceScore = Math.round((volumeConsistency + pitchStability + bodyPresence) / 3);
    const contentScore = Math.round((contentClarity + Math.min(100, 100 - repetition)) / 2);
    
    // Overall score based on available data
    let overallScore = 0;
    let totalWeight = 0;
    
    if (hasAudioData) {
      overallScore += voiceScore * 0.3;
      totalWeight += 0.3;
    }
    if (hasVideoData) {
      overallScore += bodyScore * 0.3;
      totalWeight += 0.3;
    }
    if (hasNlpData) {
      overallScore += contentScore * 0.2;
      totalWeight += 0.2;
    }
    if (speechRate > 0) {
      overallScore += paceScore * 0.2;
      totalWeight += 0.2;
    }
    
    overallScore = totalWeight > 0 ? Math.round(overallScore / totalWeight) : 0;
    
    // Generate dynamic content based on ACTUAL performance
    const strengths = [];
    const improvements = [];
    const speakingTips = [];
    const practiceDrills = [];
    
    // Voice analysis
    if (voiceClarity > 80) {
      strengths.push(`Excellent voice clarity at ${voiceClarity}%`);
    } else if (voiceClarity > 60) {
      strengths.push(`Good voice clarity at ${voiceClarity}%`);
    } else if (voiceClarity > 0) {
      improvements.push(`Voice clarity needs improvement (currently ${voiceClarity}%)`);
      speakingTips.push('Practice speaking more clearly and enunciating words');
      practiceDrills.push('Record yourself reading aloud and focus on clear pronunciation');
    }
    
    if (volumeConsistency > 80) {
      strengths.push(`Consistent volume control at ${volumeConsistency}%`);
    } else if (volumeConsistency > 0 && volumeConsistency < 70) {
      improvements.push(`Volume consistency needs work (currently ${volumeConsistency}%)`);
      speakingTips.push('Practice maintaining steady volume throughout your presentation');
      practiceDrills.push('Use a microphone and practice volume control exercises');
    }
    
    if (pitchStability > 80) {
      strengths.push(`Stable vocal delivery at ${pitchStability}%`);
    } else if (pitchStability > 0 && pitchStability < 70) {
      improvements.push(`Vocal stability could improve (currently ${pitchStability}%)`);
      speakingTips.push('Work on maintaining consistent pitch and avoiding vocal strain');
      practiceDrills.push('Practice breathing exercises and vocal warm-ups');
    }
    
    // Body language analysis
    if (gestures > 80) {
      strengths.push(`Engaging gestures at ${gestures}%`);
    } else if (gestures > 0 && gestures < 70) {
      improvements.push(`Use more gestures (currently ${gestures}%)`);
      speakingTips.push('Add hand movements to emphasize key points');
      practiceDrills.push('Practice gestures in front of a mirror');
    }
    
    if (posture > 80) {
      strengths.push(`Strong posture at ${posture}%`);
    } else if (posture > 0 && posture < 70) {
      improvements.push(`Posture needs improvement (currently ${posture}%)`);
      speakingTips.push('Stand straight with shoulders back and feet shoulder-width apart');
      practiceDrills.push('Practice standing posture exercises');
    }
    
    if (eyeContact > 80) {
      strengths.push(`Excellent eye contact at ${eyeContact}%`);
    } else if (eyeContact > 0 && eyeContact < 70) {
      improvements.push(`Eye contact needs work (currently ${eyeContact}%)`);
      speakingTips.push('Look directly at the camera lens, not the screen');
      practiceDrills.push('Practice maintaining eye contact with the camera');
    }
    
    // Pacing analysis
    if (speechRate > 0) {
      if (speechRate >= 120 && speechRate <= 180) {
        strengths.push(`Optimal speaking pace at ${speechRate} words/min`);
      } else if (speechRate < 120) {
        improvements.push(`Speaking too slowly at ${speechRate} words/min`);
        speakingTips.push('Increase your speaking pace slightly');
        practiceDrills.push('Practice with a metronome to find your optimal pace');
      } else if (speechRate > 200) {
        improvements.push(`Speaking too fast at ${speechRate} words/min`);
        speakingTips.push('Slow down your delivery for better comprehension');
        practiceDrills.push('Practice pausing between sentences');
      }
    }
    
    // Content analysis
    if (fillerWords > 0) {
      if (fillerWords < 3) {
        strengths.push(`Minimal filler words at ${fillerWords.toFixed(1)}%`);
      } else if (fillerWords > 8) {
        improvements.push(`Too many filler words at ${fillerWords.toFixed(1)}%`);
        speakingTips.push('Practice pausing instead of using "um" or "uh"');
        practiceDrills.push('Record yourself and identify your filler words');
      }
    }
    
    if (repetition > 0) {
      if (repetition < 20) {
        strengths.push(`Good word variety with ${repetition}% repetition`);
      } else if (repetition > 40) {
        improvements.push(`High repetition at ${repetition}% - vary your vocabulary`);
        speakingTips.push('Use synonyms and different phrases to express ideas');
        practiceDrills.push('Practice rephrasing key points in different ways');
      }
    }
    
    // Generate summary based on actual performance
    let summary = `Your presentation scored ${overallScore}% overall. `;
    if (hasAudioData) summary += `Voice clarity: ${voiceClarity}%, `;
    if (hasVideoData) summary += `Body language: ${bodyScore}%, `;
    if (speechRate > 0) summary += `Pacing: ${paceScore}%. `;
    if (strengths.length > 0) summary += `Strengths: ${strengths.slice(0, 2).map(s => s.split(' at ')[0]).join(', ')}. `;
    if (improvements.length > 0) summary += `Areas to improve: ${improvements.slice(0, 2).map(i => i.split(' (')[0]).join(', ')}.`;
    
    // Calculate additional advanced metrics
    const engagementScore = Math.round((eyeContact + gestures + (speechRate > 0 ? paceScore : 0)) / 3);
    const contentQuality = Math.round((contentClarity + Math.min(100, 100 - repetition)) / 2);
    const professionalism = Math.round((overallScore + confidenceScore + engagementScore) / 3);
    
    // Generate advanced insights
    const presentationStyle = voiceClarity > 80 && bodyScore > 80 ? 'Confident and engaging' : 
                             voiceClarity > 60 && bodyScore > 60 ? 'Professional but could be more dynamic' : 
                             'Needs significant improvement in delivery';
    
    const audienceEngagement = engagementScore > 80 ? 'Highly engaging - would captivate audience' :
                              engagementScore > 60 ? 'Moderately engaging - good potential' :
                              'Low engagement - needs work to connect with audience';
    
    const improvementPriority = [];
    if (voiceClarity < 60) improvementPriority.push('Voice clarity');
    if (bodyScore < 60) improvementPriority.push('Body language');
    if (paceScore < 60) improvementPriority.push('Pacing');
    if (confidenceScore < 60) improvementPriority.push('Confidence');
    
    return {
      overallScore,
      voiceClarity,
      bodyLanguage: bodyScore,
      pacing: paceScore,
      confidence: confidenceScore,
      engagement: engagementScore,
      contentQuality,
      professionalism,
      summary: summary.trim(),
      strengths: strengths.length > 0 ? strengths : ['Overall presentation completed'],
      areasForImprovement: improvements.length > 0 ? improvements : ['Continue practicing for improvement'],
      speakingTips: speakingTips.length > 0 ? speakingTips : ['Practice regularly to improve your presentation skills'],
      practiceDrills: practiceDrills.length > 0 ? practiceDrills : ['Record practice sessions and review your performance'],
      scoreExplanation: `Scores calculated from actual analysis: Voice ${voiceClarity}%, Body ${bodyScore}%, Pace ${paceScore}%, Confidence ${confidenceScore}%, Engagement ${engagementScore}%`,
      nextSteps: improvements.length > 0 ? improvements.slice(0, 3) : ['Continue practicing to maintain your performance'],
      technicalNotes: [
        hasAudioData ? `Audio analysis completed` : 'Audio analysis failed',
        hasVideoData ? `Video analysis completed` : 'Video analysis failed',
        hasNlpData ? `NLP analysis completed` : 'NLP analysis failed'
      ],
      advancedInsights: {
        presentationStyle,
        audienceEngagement,
        improvementPriority: improvementPriority.length > 0 ? improvementPriority : ['Continue current practice routine'],
        strengthAreas: strengths.slice(0, 3),
        weaknessAreas: improvements.slice(0, 3),
        coachingFocus: improvementPriority.slice(0, 2)
      },
      performanceBreakdown: {
        opening: `Opening analysis: ${voiceClarity > 70 ? 'Strong start' : 'Needs improvement'} - ${voiceClarity > 70 ? 'Clear and confident beginning' : 'Work on clarity and confidence in first 30 seconds'}`,
        body: `Body analysis: ${bodyScore > 70 ? 'Engaging delivery' : 'Needs work'} - ${bodyScore > 70 ? 'Good use of body language and gestures' : 'Focus on posture and gestures'}`,
        closing: `Closing analysis: ${confidenceScore > 70 ? 'Strong finish' : 'Could be stronger'} - ${confidenceScore > 70 ? 'Confident conclusion' : 'Work on ending with confidence'}`,
        transitions: `Transitions: ${paceScore > 70 ? 'Smooth pacing' : 'Needs improvement'} - ${paceScore > 70 ? 'Good flow between topics' : 'Work on smoother topic transitions'}`
      },
      recommendations: {
        immediate: improvements.slice(0, 2),
        shortTerm: [`Practice ${improvementPriority[0] || 'overall delivery'} daily for 15 minutes`],
        longTerm: ['Develop a consistent practice routine', 'Record weekly progress videos', 'Focus on audience engagement techniques']
      }
    };

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return null;
  }
}


