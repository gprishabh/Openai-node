import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/FileUpload";
import { Mic, MicOff, Send, X } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { R } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

interface InputAreaProps {
  features: {
    chat: boolean;
    knowledgeBase: boolean;
    imageGeneration: boolean;
    audioInput: boolean;
    textToSpeech: boolean;
    moderation: boolean;
  };
  onSendMessage: (message: string, options?: {
    enableTTS?: boolean;
    ttsVoice?: string;
  }) => Promise<void>;
  isLoading: boolean;
  sessionId: string;
  onTranscriptionUpdate?: () => Promise<void>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Input Area Component
 * @description Message input with file upload, voice recording, and options
 */
export function InputArea({ features, onSendMessage, isLoading, sessionId, onTranscriptionUpdate, message, setMessage }: InputAreaProps) {
  const [streamResponse, setStreamResponse] = useState(true);
  const [enableTTS, setEnableTTS] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{
    id: string;
    filename: string;
    uploadDate: Date;
    chunkCount: number;
  }>>([]);
  const [audioTranscriptions, setAudioTranscriptions] = useState<Array<{
    id: string;
    text: string;
    filename: string;
    language: string;
    duration: number;
    fileSize: number;
    timestamp: Date;
    confidence: number;
  }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  /**
   * Handle voice recording toggle
   */
  const handleToggleRecording = () => {
    if (!features.audioInput || !features.chat) {
      if (!features.chat) {
        toast({
          title: "Chat Mode Inactive",
          description: "Please enable Chat Mode to use voice input.",
          variant: "destructive",
        });
      } else if (!features.audioInput) {
        toast({
          title: "Audio Input Disabled",
          description: "Please enable Audio Input feature to use voice recording.",
          variant: "destructive",
        });
      }
      return;
    }

    if (!voiceRecording.isSupported) {
      toast({
        title: "Voice Recording Not Supported",
        description: "Your browser doesn't support voice recording.",
        variant: "destructive",
      });
      return;
    }

    voiceRecording.toggleRecording();
  };

  // Fetch uploaded documents
  const fetchUploadedDocuments = async () => {
    try {
      const response = await api.getDocuments();
      if (response.success) {
        setUploadedDocuments(response.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  // Fetch audio transcriptions
  const fetchAudioTranscriptions = async () => {
    try {
      const response = await api.getTranscriptions(sessionId);
      if (response.success) {
        setAudioTranscriptions(response.transcriptions || []);
      }
    } catch (error) {
      console.error("Failed to fetch transcriptions:", error);
    }
  };

  // Handle document removal
  const handleRemoveDocument = async (documentId: string) => {
    try {
      const response = await api.removeDocument(documentId);
      
      if (response.success) {
        toast({
          title: "Document Removed",
          description: "Document has been successfully removed from the knowledge base.",
          variant: "default",
        });
        
        // Refresh the document list
        await fetchUploadedDocuments();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to remove document.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to remove document:", error);
      toast({
        title: "Error",
        description: "Failed to remove document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle audio transcription removal
  const handleRemoveTranscription = async (transcriptionId: string) => {
    try {
      const response = await api.removeTranscription(sessionId, transcriptionId);
      
      if (response.success) {
        toast({
          title: "Audio Removed",
          description: "Audio transcription has been successfully removed.",
          variant: "default",
        });
        
        // Refresh the transcription list
        await fetchAudioTranscriptions();
        
        // Also refresh the ChatArea transcription list
        if (onTranscriptionUpdate) {
          await onTranscriptionUpdate();
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to remove transcription.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to remove transcription:", error);
      toast({
        title: "Error",
        description: "Failed to remove transcription. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load documents on component mount and when knowledge base feature changes
  useEffect(() => {
    if (features.knowledgeBase) {
      fetchUploadedDocuments();
    } else {
      setUploadedDocuments([]);
    }
  }, [features.knowledgeBase]);

  // Load audio transcriptions when audio input feature changes
  useEffect(() => {
    fetchAudioTranscriptions();
  }, [sessionId]);

  // Initialize voice recording hook
  const voiceRecording = useVoiceRecording({
    sessionId,
    onTranscriptionComplete: (text: string) => {
      // Add the transcribed text to the message input
      setMessage(prev => prev + (prev ? ' ' : '') + text);
    },
    onTranscriptionUpdate: fetchAudioTranscriptions,
  });

  // Quick action prompts
  const quickActions = [
    "Explain embeddings",
    "Generate code example", 
    "Show API usage",
    "Test moderation",
  ];

  /**
   * Handle message sending
   */
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    // Don't allow message sending if Chat Mode is inactive
    if (!features.chat) {
      toast({
        title: "Chat Mode Inactive",
        description: "Please enable Chat Mode to send messages.",
        variant: "destructive",
      });
      return;
    }

    const messageToSend = message;
    setMessage("");
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await onSendMessage(messageToSend, {
        enableTTS: enableTTS && features.textToSpeech,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Auto-resize textarea
   */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    setMessage(target.value);
    
    // Auto-resize
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  /**
   * Handle quick action clicks
   */
  const handleQuickAction = (action: string) => {
    // Don't allow quick actions if Chat Mode is inactive
    if (!features.chat) {
      toast({
        title: "Chat Mode Inactive",
        description: "Please enable Chat Mode to use sample prompts.",
        variant: "destructive",
      });
      return;
    }
    
    setMessage(action);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  /**
   * Handle file uploads
   */
  const handleDocumentUpload = async (files: FileList) => {
    if (!features.knowledgeBase) {
      toast({
        title: "Knowledge Base Disabled",
        description: "Please enable the knowledge base feature to upload documents.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          const result = await api.uploadDocument(file);
          return { file: file.name, success: true, result };
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          return { 
            file: file.name, 
            success: false, 
            error: error instanceof Error ? error.message : "Upload failed" 
          };
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results.filter(r => r.status === "fulfilled" && r.value.success).length;
      const failed = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success)).length;
      
      if (successful > 0) {
        toast({
          title: "Documents Uploaded",
          description: `Successfully uploaded ${successful} document(s) to the knowledge base.${failed > 0 ? ` ${failed} upload(s) failed.` : ""}`,
        });
        // Refresh the document list
        await fetchUploadedDocuments();
      }
      
      if (failed > 0 && successful === 0) {
        toast({
          title: "Upload Failed",
          description: "Failed to upload documents. Please check file formats and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Document upload error:", error);
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading documents.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioUpload = async (files: FileList) => {

    const file = files[0];
    if (!file) return;

    // Validate file type by extension (more reliable than MIME type)
    const allowedExtensions = [".mp3", ".wav", ".m4a", ".mp4", ".mpeg", ".mpga", ".flac", ".ogg", ".webm"];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload a supported audio file: ${allowedExtensions.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 25MB as per OpenAI Whisper API limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Audio file must be smaller than 25MB.",
        variant: "destructive",
      });
      return;
    }

    // Check for empty file
    if (file.size === 0) {
      toast({
        title: "Empty File",
        description: "The uploaded file appears to be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true); // Start loading state

    try {
      // Show loading toast
      toast({
        title: "Transcribing Audio",
        description: `Processing ${file.name}... This may take a moment.`,
      });

      // Transcribe the audio
      const response = await api.transcribeAudio(file, sessionId);

      if (response.success) {
        toast({
          title: "Audio Transcribed Successfully",
          description: `Transcription completed. Language: ${response.transcription.language}. Confidence: ${Math.round(response.transcription.confidence * 100)}%. Check the transcription panel to use the text.`,
          variant: "default",
        });

        // Refresh the transcription list in ChatArea
        if (onTranscriptionUpdate) {
          await onTranscriptionUpdate();
        }

        // Also refresh local list for display in InputArea
        await fetchAudioTranscriptions();
      } else {
        toast({
          title: "Transcription Failed",
          description: response.error || "Failed to transcribe audio file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Audio transcription error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred while transcribing the audio file.";
      toast({
        title: "Transcription Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false); // End loading state
    }
  };

  return (
    <div className="p-6 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto">
        {/* File Upload Area */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          {/* Document Upload */}
          <FileUpload
            accept=".txt,.pdf,.docx"
            multiple
            onUpload={handleDocumentUpload}
            disabled={!features.knowledgeBase || isUploading}
            className={`h-20 ${!features.knowledgeBase || isUploading ? "opacity-50" : ""}`}
            data-testid="upload-documents"
          >
            <div className="text-center">
              <span className="text-lg mb-2 block">📄</span>
              <p className="text-sm text-slate-500">
                {isUploading ? "Uploading..." : "Upload documents for knowledge base"}
              </p>
              <p className="text-xs text-slate-400">.txt, .pdf, .docx supported</p>
            </div>
          </FileUpload>

          {/* Audio Upload */}
          <FileUpload
            accept="audio/*"
            onUpload={handleAudioUpload}
            disabled={isTranscribing}
            className={`h-20 ${isTranscribing ? "opacity-50" : ""}`}
            data-testid="upload-audio"
          >
            <div className="text-center">
              {isTranscribing ? (
                <>
                  <div className="animate-spin text-lg mb-2 block">⏳</div>
                  <p className="text-sm text-slate-500">Transcribing audio...</p>
                  <p className="text-xs text-slate-400">Please wait while we process your audio</p>
                </>
              ) : (
                <>
                  <span className="text-lg mb-2 block">🎤</span>
                  <p className="text-sm text-slate-500">Upload audio for AI transcription</p>
                  <p className="text-xs text-slate-400">.mp3, .wav, .m4a, .mp4, .flac, .ogg, .webm (max 25MB)</p>
                </>
              )}
            </div>
          </FileUpload>
        </div>

        {/* Uploaded Documents List */}
        {features.knowledgeBase && uploadedDocuments.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">📁 Uploaded Documents</h4>
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">📄</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{doc.filename}</p>
                      <p className="text-xs text-slate-500">
                        {doc.chunkCount} chunks • {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6 text-slate-400 hover:text-red-500"
                        title="Remove document"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove "{doc.filename}" from the knowledge base? 
                          This action cannot be undone and the AI will no longer be able to reference this document.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audio Transcriptions List */}
        {audioTranscriptions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">🎵 Audio Transcriptions</h4>
            <div className="space-y-2">
              {audioTranscriptions.map((transcription) => (
                <div
                  key={transcription.id}
                  className="flex items-start justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-start space-x-2 flex-1">
                    <span className="text-sm mt-1">🎤</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{transcription.filename}</p>
                      <p className="text-xs text-slate-500 mb-1">
                        {transcription.language} • {transcription.duration > 0 ? `${transcription.duration}s` : 'Unknown duration'} • {Math.round(transcription.confidence * 100)}% confidence
                      </p>
                      <p className="text-sm text-slate-700 bg-white p-2 rounded border">
                        {transcription.text.length > 150 
                          ? `${transcription.text.substring(0, 150)}...` 
                          : transcription.text
                        }
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(transcription.timestamp).toLocaleDateString()} • {Math.round(transcription.fileSize / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6 text-slate-400 hover:text-red-500 ml-2"
                        title="Remove transcription"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Audio Transcription</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this audio transcription? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveTranscription(transcription.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            {/* Recording Status Indicator - Above textarea */}
            {voiceRecording.isRecording && (
              <div className="mb-2 flex items-center justify-center">
                <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-600 font-medium">Recording...</span>
                  {/* Audio Level Indicator */}
                  <div className="flex space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-4 w-1 rounded-full transition-all duration-100 ${
                          voiceRecording.audioLevel > (i + 1) * 0.2
                            ? 'bg-red-500'
                            : 'bg-red-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={features.chat 
                  ? (voiceRecording.isRecording 
                      ? "Recording your voice..." 
                      : "Type your message, ask about uploaded documents, request an image, or use voice input...")
                  : "Enable Chat Mode to start sending messages..."
                }
                className={`resize-none rounded-xl border px-4 py-3 pr-12 focus:outline-none transition-all duration-200 ${
                  voiceRecording.isRecording
                    ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : features.chat 
                      ? "border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
                rows={1}
                maxLength={4000}
                disabled={isLoading || !features.chat}
                data-testid="input-message"
              />
              
              {/* Voice Recording Button */}
              <Button
                variant="ghost" 
                size="sm"
                onClick={handleToggleRecording}
                className={`absolute right-3 top-3 p-1 transition-colors ${
                  voiceRecording.isRecording 
                    ? "text-red-500 hover:text-red-600" 
                    : (features.audioInput && features.chat)
                      ? "text-slate-400 hover:text-slate-600"
                      : "text-slate-300 cursor-not-allowed"
                }`}
                disabled={!features.audioInput || !features.chat || voiceRecording.isProcessing}
                data-testid="button-recording"
                title={
                  voiceRecording.isRecording 
                    ? "Stop recording" 
                    : voiceRecording.isProcessing 
                      ? "Processing..." 
                      : "Start voice recording"
                }
              >
                {voiceRecording.isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : voiceRecording.isProcessing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Input Controls */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stream-response"
                    checked={streamResponse}
                    onCheckedChange={(checked) => setStreamResponse(checked === true)}
                    data-testid="checkbox-stream"
                  />
                  <label htmlFor="stream-response" className="cursor-pointer">
                    Stream response
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="text-to-speech"
                    checked={enableTTS}
                    onCheckedChange={(checked) => setEnableTTS(checked === true)}
                    disabled={!features.textToSpeech}
                    data-testid="checkbox-tts"
                  />
                  <label htmlFor="text-to-speech" className={`cursor-pointer ${
                    !features.textToSpeech ? "opacity-50" : ""
                  }`}>
                    Text-to-speech
                  </label>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                <span data-testid="message-length">{message.length}</span>/4000 characters
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading || !features.chat}
            className={`px-6 py-3 rounded-xl transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              features.chat 
                ? "bg-blue-500 hover:bg-blue-600 text-white" 
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
            data-testid="button-send"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2 mt-4">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action)}
              disabled={!features.chat}
              className={`px-3 py-1 text-sm rounded-full transition-colors border-0 ${
                features.chat 
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-600" 
                  : "bg-slate-50 text-slate-400 cursor-not-allowed"
              }`}
              data-testid={`quick-action-${action.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
