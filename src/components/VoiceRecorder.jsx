import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

/**
 * VoiceRecorder Component
 * Handles voice recording, conversion to WAV, and transcription
 * Designed for AI Tutor Companion integration
 */
export default function VoiceRecorder({ 
  onTranscription, 
  onError, 
  disabled = false,
  className = '',
  showStatus = true 
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Convert audio blob to WAV format
  const convertBlobToWav = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV
      const wavBuffer = audioBufferToWav(audioBuffer);
      
      // Close audio context after conversion
      audioContext.close().catch(err => console.warn('Error closing audio context:', err));
      
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting blob to WAV:', error);
      throw new Error('Failed to convert audio to WAV format: ' + error.message);
    }
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer) => {
    const numOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
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

    // Write WAV header
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

    // Interleave and write audio data
    const interleaved = interleave(channelData);
    const volume = 1;
    for (let i = 0; i < interleaved.length; i += 1, offset += 2) {
      const sample = Math.max(-1, Math.min(1, interleaved[i] * volume));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return wavBuffer;
  };

  // Interleave audio channels
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

  // Start recording
  const startRecording = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      const errorMsg = 'This browser does not support audio capture. Please switch to a modern browser.';
      setStatusMessage(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        processRecording();
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        const errorMsg = 'Recording error occurred';
        setStatusMessage(errorMsg);
        if (onError) onError(new Error(errorMsg));
        stopRecording();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setStatusMessage('Listening... Click to stop');
    } catch (micError) {
      console.error('Microphone access failed:', micError);
      let errorMsg = 'Please enable microphone access to use voice commands';
      if (micError.name === 'NotAllowedError') {
        errorMsg = 'Microphone access denied. Please allow microphone permissions and try again.';
      } else if (micError.name === 'NotFoundError') {
        errorMsg = 'No microphone found. Please connect a microphone and try again.';
      }
      setStatusMessage(errorMsg);
      if (onError) onError(new Error(errorMsg));
    }
  }, [onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (!isTranscribing) {
      setStatusMessage('');
    }
  }, [isTranscribing]);

  // Process recorded audio
  const processRecording = useCallback(async () => {
    if (!recordedChunksRef.current.length) {
      const errorMsg = 'No audio captured. Please try again.';
      setStatusMessage(errorMsg);
      if (onError) onError(new Error(errorMsg));
      setIsRecording(false);
      return;
    }

    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(recordedChunksRef.current, { type: mimeType });
    
    if (audioBlob.size === 0) {
      const errorMsg = 'No audio data captured. Please try again.';
      setStatusMessage(errorMsg);
      if (onError) onError(new Error(errorMsg));
      setIsRecording(false);
      recordedChunksRef.current = [];
      return;
    }

    setIsTranscribing(true);
    setStatusMessage('Transcribing...');

    try {
      console.log('Converting audio to WAV format...');
      const wavBlob = await convertBlobToWav(audioBlob);
      console.log('WAV conversion successful, size:', wavBlob.size, 'bytes');
      
      const formData = new FormData();
      formData.append('file', wavBlob, 'voice-input.wav');

      console.log('Sending audio to transcription service...');
      const response = await fetch('http://localhost:8000/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const payload = await response.json();
      console.log('Transcription received:', payload);
      
      if (!payload.text || payload.text.trim().length === 0) {
        throw new Error('No text was transcribed from the audio');
      }

      setStatusMessage('Transcription successful!');
      if (onTranscription) {
        onTranscription(payload.text);
      }
    } catch (voiceError) {
      console.error('Voice processing failed:', voiceError);
      const errorMsg = voiceError.message || 'Voice transcription failed. Please try again.';
      setStatusMessage(errorMsg);
      if (onError) onError(voiceError);
    } finally {
      setIsTranscribing(false);
      setTimeout(() => setStatusMessage(''), 2000);
      recordedChunksRef.current = [];
      setIsRecording(false);
    }
  }, [onTranscription, onError]);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className={`voice-recorder ${className}`}>
      <button
        onClick={toggleRecording}
        disabled={disabled || isTranscribing}
        className={`
          flex items-center justify-center gap-2 px-4 py-2 rounded-lg
          transition-all duration-200 font-medium
          ${isRecording 
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
          ${disabled || isTranscribing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={isRecording ? 'Click to stop recording' : 'Click to start recording'}
      >
        {isTranscribing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : isRecording ? (
          <>
            <MicOff className="w-5 h-5" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span>Record</span>
          </>
        )}
      </button>
      
      {showStatus && statusMessage && (
        <p className="mt-2 text-sm text-gray-600 text-center">{statusMessage}</p>
      )}
    </div>
  );
}
