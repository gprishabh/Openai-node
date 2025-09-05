import { useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface VoiceRecordingHookProps {
  sessionId: string;
  onTranscriptionComplete?: (text: string) => void;
  onTranscriptionUpdate?: () => Promise<void>;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  audioLevel: number;
}

export function useVoiceRecording({
  sessionId,
  onTranscriptionComplete,
  onTranscriptionUpdate,
}: VoiceRecordingHookProps) {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    audioLevel: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  /**
   * Initialize audio level monitoring
   */
  const initializeAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        const sum = dataArray.reduce((acc, value) => acc + value, 0);
        const average = sum / bufferLength;
        const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1
        
        setState(prev => ({ ...prev, audioLevel: normalizedLevel }));
        
        if (state.isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.warn('Audio level monitoring not available:', error);
    }
  }, [state.isRecording]);

  /**
   * Cleanup audio resources
   */
  const cleanupAudioResources = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null, audioLevel: 0 }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      
      // Initialize audio level monitoring
      initializeAudioLevelMonitoring(stream);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available event
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      // Handle recording stop event
      mediaRecorder.addEventListener('stop', async () => {
        setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorder.mimeType 
          });
          
          // Only process if we have actual audio data
          if (audioBlob.size > 0) {
            await processRecording(audioBlob);
          }
        } catch (error) {
          console.error('Error processing recording:', error);
          setState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            error: 'Failed to process recording' 
          }));
          toast({
            title: 'Recording Error',
            description: 'Failed to process your recording. Please try again.',
            variant: 'destructive',
          });
        } finally {
          cleanupAudioResources();
        }
      });

      // Start recording
      mediaRecorder.start(1000); // Collect data every second

      toast({
        title: 'Recording Started',
        description: 'Speak now. Click the microphone again to stop recording.',
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Failed to start recording';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please check your audio devices.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Audio recording is not supported in this browser.';
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        error: errorMessage,
        audioLevel: 0 
      }));
      
      toast({
        title: 'Recording Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      cleanupAudioResources();
    }
  }, [initializeAudioLevelMonitoring, cleanupAudioResources, toast]);

  /**
   * Stop voice recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      toast({
        title: 'Recording Stopped',
        description: 'Processing your voice recording...',
      });
    }
  }, [toast]);

  /**
   * Process the recorded audio blob
   */
  const processRecording = useCallback(async (audioBlob: Blob) => {
    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], `voice-recording-${Date.now()}.webm`, {
        type: audioBlob.type,
      });

      // Send to transcription API
      const result = await api.transcribeAudio(audioFile, sessionId, {
        language: 'en', // Auto-detect, but can be configurable
      });

      if (result.success && result.transcription) {
        const transcribedText = result.transcription.text;
        
        toast({
          title: 'Voice Transcribed',
          description: `"${transcribedText.substring(0, 50)}${transcribedText.length > 50 ? '...' : ''}"`,
        });

        // Call completion callback with transcribed text
        if (onTranscriptionComplete) {
          onTranscriptionComplete(transcribedText);
        }

        // Refresh transcription list
        if (onTranscriptionUpdate) {
          await onTranscriptionUpdate();
        }
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
      
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Transcription Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [sessionId, onTranscriptionComplete, onTranscriptionUpdate, toast]);

  /**
   * Toggle recording state
   */
  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  /**
   * Cancel current recording
   */
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    cleanupAudioResources();
    setState(prev => ({ 
      ...prev, 
      isRecording: false, 
      isProcessing: false, 
      error: null,
      audioLevel: 0 
    }));
    
    toast({
      title: 'Recording Cancelled',
      description: 'Voice recording has been cancelled.',
    });
  }, [cleanupAudioResources, toast]);

  /**
   * Check if voice recording is supported
   */
  const isSupported = useCallback(() => {
    return !!(
      typeof navigator !== 'undefined' && 
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === 'function' && 
      typeof window !== 'undefined' && 
      window.MediaRecorder
    );
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
    cancelRecording,
    isSupported: isSupported(),
  };
}
