import { useState, useEffect } from "react";
import { MessageList } from "./MessageList";
import { InputArea } from "./InputArea";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Mic, MicOff, Copy, X, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionItem } from "./TranscriptionItem";

export interface AIFeatures{
  chat: boolean;
  knowledgeBase: boolean;
  imageGeneration: boolean;
  audioInput: boolean;
  textToSpeech: boolean;
  moderation: boolean;
}

interface ChatAreaProps {
  sessionId: string;
  messages: any[];
  isLoading: boolean;
  features: AIFeatures;
  onSendMessage: (message: string, options?: {
    enableTTS?: boolean;
    ttsVoice?: string;
  }) => Promise<void>;
  onClearHistory: () => void;
}

export interface AudioTranscription {
  id: string;
  text: string;
  filename: string;
  language: string;
  duration: number;
  fileSize: number;
  timestamp: Date;
  confidence: number;
}

/**
 * Chat Area Component
 * @description Main chat interface with header, messages, and input area
 */
export function ChatArea({
  sessionId,
  messages,
  isLoading,
  features,
  onSendMessage,
  onClearHistory,
}: ChatAreaProps) {
  const [audioTranscriptions, setAudioTranscriptions] = useState<AudioTranscription[]>([]);
  const [showTranscriptions, setShowTranscriptions] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

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

  // Load audio transcriptions when component mounts and audio input feature changes
  useEffect(() => {
    fetchAudioTranscriptions();
  }, [sessionId]);

  // Show transcriptions panel when new transcriptions are available
  useEffect(() => {
    if (audioTranscriptions.length > 0) {
      // Only auto-show if it was previously hidden and we have new transcriptions
      const hasNewTranscriptions = audioTranscriptions.some(t => 
        new Date(t.timestamp).getTime() > Date.now() - 30000 // within last 30 seconds
      );
      if (hasNewTranscriptions) {
        setShowTranscriptions(true);
      }
    }
  }, [audioTranscriptions.length]);

  /**
   * Handle copying transcription text to clipboard
   */
  const handleCopyTranscription = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Transcription text has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle adding transcription to message input
   */
  const handleUseTranscription = (text: string) => {
    // This will be passed to InputArea component
    onSendMessage(text);
  };

  /**
   * Handle removing audio transcription
   */
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

  /**
   * Handle chat export
   */
  const handleExportChat = () => {
    const chatData = {
      sessionId,
      messages,
      exportTime: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-6 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800" data-testid="chat-title">
                  AI Personal Assistant
                </h2>
                <p className="text-sm text-slate-500">
                  Powered by GPT-5 with multimodal capabilities
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Transcriptions Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscriptions(!showTranscriptions)}
              className={`p-2 transition-colors ${
                showTranscriptions
                  ? "text-blue-500 hover:text-blue-600 bg-blue-50"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Toggle audio transcriptions panel"
              data-testid="button-transcriptions"
            >
              <Mic className="h-4 w-4" />
              <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                {audioTranscriptions.length}
              </span>
            </Button>

            {/* Clear Chat Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              data-testid="button-clear-chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Export Chat Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportChat}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              data-testid="button-export-chat"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <MessageList 
            messages={messages} 
            isLoading={isLoading}
            data-testid="message-list"
          />
        </div>

        {/* Audio Transcriptions Panel */}
        {showTranscriptions && (
          <div className="w-80 border-l border-slate-200 bg-slate-50">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800 flex items-center space-x-2">
                  <Mic className="h-4 w-4" />
                  <span>Audio Transcriptions</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranscriptions(false)}
                  className="p-1 h-6 w-6 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {audioTranscriptions.length > 0 
                  ? `${audioTranscriptions.length} transcription${audioTranscriptions.length !== 1 ? 's' : ''} available`
                  : 'Upload audio files to see transcriptions here'
                }
              </p>
            </div>
            
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {audioTranscriptions.length > 0 ? (
                audioTranscriptions.map((transcription) => (
                  <TranscriptionItem
                    key={transcription.id}
                    transcription={transcription}
                    onRemove={handleRemoveTranscription}
                    onCopy={handleCopyTranscription}
                    onUse={handleUseTranscription}
                    chatEnabled={features.chat}
                    setMessage={setMessage}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Mic className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-2">No transcriptions yet</p>
                  <p className="text-xs text-slate-400">
                    Upload audio files using the audio upload area below to see transcriptions here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <InputArea
        features={features}
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        sessionId={sessionId}
        onTranscriptionUpdate={fetchAudioTranscriptions}
        data-testid="input-area"
        setMessage={setMessage}
        message={message}
      />
    </div>
  );
}
