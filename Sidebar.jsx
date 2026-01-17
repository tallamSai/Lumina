import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Server, Database, Zap, Box, Globe, Network, Cloud, Layers } from 'lucide-react';
import axios from 'axios';

// Icon mapping
const iconMap = {
  Server,
  Database,
  Zap,
  Box,
  Globe,
  Network,
  Cloud,
  Layers,
};

export default function SaiServiceSidebar({ 
  onSaveWorkflow, 
  isSaving, 
  savedWorkflowId, 
  onClearCanvas, 
  showAI: showAIProp, 
  setShowAI: setShowAIProp, 
  desc: descProp, 
  setDesc: setDescProp, 
  generate,
  onWorkflowGenerated // ✅ NEW: Callback to update nodes/edges
}) {
  const [localShowAI, setLocalShowAI] = useState(false);
  const [localDesc, setLocalDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [cloudServices, setCloudServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/services/?active_only=true');
        const services = response.data.map(service => ({
          id: service.service_type,
          label: service.label,
          icon: iconMap[service.icon_name] || Server,
          color: service.color,
          description: service.description,
        }));
        setCloudServices(services);
      } catch (error) {
        console.error('Error fetching services:', error);
        // No fallback - services must be loaded from API
        setCloudServices([]);
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // Add Azure and GCP services to cloudServices if not present from API
  const defaultServices = [
    {
      id: 'azure_vm',
      label: 'Azure VM',
      icon: Server,
      color: 'bg-purple-600',
      description: 'Azure Virtual Machine',
    },
    {
      id: 'azure_storage',
      label: 'Azure Storage',
      icon: Box,
      color: 'bg-purple-500',
      description: 'Azure Blob Storage',
    },
    {
      id: 'gcp_compute',
      label: 'GCP Compute',
      icon: Server,
      color: 'bg-yellow-600',
      description: 'Google Compute Engine',
    },
    {
      id: 'gcp_storage',
      label: 'GCP Storage',
      icon: Box,
      color: 'bg-yellow-500',
      description: 'Google Cloud Storage',
    },
  ];

  const mergedCloudServices = [
    ...cloudServices,
    ...defaultServices.filter(ds => !cloudServices.some(cs => cs.id === ds.id)),
  ];

  const showAI = showAIProp ?? localShowAI;
  const setShowAI = setShowAIProp ?? setLocalShowAI;
  const desc = descProp ?? localDesc;
  const setDesc = setDescProp ?? setLocalDesc;

  const onDragStart = (event, serviceType) => {
    event.dataTransfer.setData('application/reactflow', serviceType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const runGeneration = useCallback(async (promptText) => {
    const cleanPrompt = promptText?.trim();
    if (!cleanPrompt) {
      setError('Please provide a workflow description');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      if (generate) {
        await generate(cleanPrompt);
      } else {
        const res = await fetch('http://localhost:8000/api/ai/generate-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: cleanPrompt }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.detail || `API error: ${res.status}`);
        }

        const data = await res.json();
        let workflow;
        try {
          const workflowText = data.workflow.replace(/```json\n?|\n?```/g, '').trim();
          workflow = JSON.parse(workflowText);
        } catch (parseError) {
          console.error('Failed to parse workflow:', data.workflow);
          throw new Error('Invalid workflow format from AI');
        }

        if (onWorkflowGenerated && workflow.nodes && workflow.edges) {
          onWorkflowGenerated(workflow.nodes, workflow.edges);
        }
      }

      setShowAI(false);
      setDesc('');
    } catch (err) {
      console.error('AI generation failed:', err);
      setError(err.message || 'Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  }, [generate, onWorkflowGenerated, setDesc, setShowAI]);

  const handleGenerate = () => runGeneration(desc);

  const convertBlobToWav = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV
      const wavBuffer = audioBufferToWav(audioBuffer);
      
      // Close audio context after conversion (don't close before using the buffer)
      audioContext.close().catch(err => console.warn('Error closing audio context:', err));
      
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting blob to WAV:', error);
      throw new Error('Failed to convert audio to WAV format: ' + error.message);
    }
  };

  const audioBufferToWav = (buffer) => {
    const numOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const channelData = [];
    let totalLength = 0;
    for (let channel = 0; channel < numOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      channelData.push(data);
      totalLength += data.length;
    }

    const bufferLength = totalLength * (bitDepth / 8);
    const wavBuffer = new ArrayBuffer(44 + bufferLength);
    const view = new DataView(wavBuffer);
    let offset = 0;

    const writeString = (str) => {
      for (let i = 0; i < str.length; i += 1) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
      offset += str.length;
    };

    writeString('RIFF');
    view.setUint32(offset, 36 + bufferLength, true); offset += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, format, true); offset += 2;
    view.setUint16(offset, numOfChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numOfChannels * (bitDepth / 8), true); offset += 4;
    view.setUint16(offset, numOfChannels * (bitDepth / 8), true); offset += 2;
    view.setUint16(offset, bitDepth, true); offset += 2;
    writeString('data');
    view.setUint32(offset, bufferLength, true); offset += 4;

    const interleaved = interleave(channelData);
    const volume = 1;
    for (let i = 0; i < interleaved.length; i += 1, offset += 2) {
      const sample = Math.max(-1, Math.min(1, interleaved[i] * volume));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return wavBuffer;
  };

  const interleave = (channels) => {
    if (channels.length === 1) {
      return channels[0];
    }
    const length = channels[0].length;
    const result = new Float32Array(length * channels.length);
    let index = 0;
    for (let i = 0; i < length; i += 1) {
      for (let channel = 0; channel < channels.length; channel += 1) {
        result[index++] = channels[channel][i];
      }
    }
    return result;
  };

  const startRecording = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('This browser does not support audio capture. Please switch to a modern browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        processRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVoiceMessage('Listening... tap again to stop');
    } catch (micError) {
      console.error('Microphone access failed:', micError);
      setError('Please enable microphone access to use voice commands');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processRecording = async () => {
    if (!recordedChunksRef.current.length) {
      setError('No audio captured. Please try again.');
      setIsRecording(false);
      return;
    }

    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
    
    // Check if audio blob has content
    if (audioBlob.size === 0) {
      setError('No audio data captured. Please try again.');
      setIsRecording(false);
      recordedChunksRef.current = [];
      return;
    }

    setIsTranscribing(true);
    setVoiceMessage('Transcribing voice command...');

    try {
      console.log('Converting audio to WAV format...');
      const wavBlob = await convertBlobToWav(audioBlob);
      console.log('WAV conversion successful, size:', wavBlob.size, 'bytes');
      
      const formData = new FormData();
      formData.append('file', wavBlob, 'voice-command.wav');

      console.log('Sending audio to transcription service...');
      let response;
      try {
        response = await fetch('http://localhost:8000/api/voice/transcribe', {
          method: 'POST',
          body: formData,
        });
      } catch (fetchError) {
        console.error('Network error:', fetchError);
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          throw new Error('Cannot connect to server. Please make sure the backend server is running on http://localhost:8000');
        }
        throw new Error(`Network error: ${fetchError.message}. Please check if the backend server is running.`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const payload = await response.json();
      console.log('Transcription received:', payload);
      
      if (!payload.text || payload.text.trim().length === 0) {
        throw new Error('No text was transcribed from the audio');
      }

      setDesc(payload.text);
      setVoiceMessage('Transcription successful! Generating workflow...');
      await runGeneration(payload.text);
    } catch (voiceError) {
      console.error('Voice processing failed:', voiceError);
      setError(voiceError.message || 'Voice command failed. Please try again.');
      setVoiceMessage('Transcription failed. Please try again.');
    } finally {
      setIsTranscribing(false);
      setVoiceMessage('');
      recordedChunksRef.current = [];
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      {!isSidebarOpen && (
        <button
          className="fixed top-1/2 right-0 z-[100] bg-blue-600 text-white px-2 py-6 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer text-sm"
          onClick={() => setIsSidebarOpen(true)}
          style={{ 
            pointerEvents: 'auto',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            top: '50%',
            transform: 'translateY(-50%)',
            right: '0px'
          }}
        >
          Cloud Services
        </button>
      )}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          style={{ pointerEvents: 'none' }}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-blue-200 shadow-2xl transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-blue-100 px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Cloud Services</h2>
            <p className="text-xs text-gray-600">Drag cloud services to canvas</p>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="h-full overflow-y-auto p-4 pb-32">
          {onSaveWorkflow && (
            <div className="mb-4 space-y-2 sai-save-section">
              <button
                onClick={onSaveWorkflow}
                disabled={isSaving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-sm sai-save-btn"
              >
                {isSaving ? 'Saving...' : 'Save Workflow'}
              </button>
              <button
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-all"
                onClick={() => setShowAI(true)}
              >
                Generate with AI
              </button>

              {onClearCanvas && (
                <button
                  onClick={onClearCanvas}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-semibold"
                >
                  Clear Canvas
                </button>
              )}
              {savedWorkflowId && (
                <p className="text-xs text-gray-600 text-center">
                  Saved (ID: {savedWorkflowId})
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 sai-services-list">
            {isLoadingServices ? (
              <div className="text-center py-4 text-gray-600">Loading services...</div>
            ) : mergedCloudServices.length === 0 ? (
              <div className="text-center py-4 text-gray-600">No services available</div>
            ) : (
              mergedCloudServices.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, service.id)}
                    className={`sai-service-card ${service.color} p-4 rounded-lg cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-200 shadow-md border border-blue-300`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="text-white" size={24} />
                      <div>
                        <div className="font-semibold text-white">{service.label}</div>
                        <div className="text-xs text-white/90">{service.description}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 sai-tips-box">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Notes</h3>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Drag cloud services to canvas</li>
              <li>• Connect nodes to build workflows</li>
              <li>• Click nodes to configure</li>
              <li>• Estimate costs anytime</li>
            </ul>
          </div>
        </div>
      </aside>

      {showAI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-[90vw]">
            <h2 className="text-lg font-bold mb-3">AI Workflow Generator</h2>

            <textarea
              className="w-full border border-gray-300 rounded p-3 h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your workflow... (e.g., 'Create a web app with load balancer, EC2 instances, and RDS database')"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              disabled={isGenerating || isTranscribing}
            />

            {error && (
              <div className="mt-2 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-4">
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-all disabled:opacity-50"
                onClick={() => {
                  setShowAI(false);
                  setError('');
                }}
                disabled={isGenerating || isTranscribing}
              >
                Cancel
              </button>
              <button
                className={`sai-voice-btn ${isRecording ? 'recording' : ''}`}
                type="button"
                onClick={toggleRecording}
                disabled={isGenerating || isTranscribing}
              >
                {isRecording ? 'Stop' : 'Speak'}
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerate}
                disabled={isGenerating || !desc.trim() || isTranscribing}
              >
                {isGenerating || isTranscribing ? 'Working...' : 'Generate'}
              </button>
            </div>

            {voiceMessage && (
              <p className="text-xs text-blue-600 mt-2 text-center sai-voice-hint">{voiceMessage}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}