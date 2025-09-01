import { useState } from "react";
import { MessageList } from "./MessageList";
import { InputArea } from "./InputArea";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Mic, MicOff } from "lucide-react";

interface ChatAreaProps {
  sessionId: string;
  messages: any[];
  isLoading: boolean;
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
  onClearHistory: () => void;
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
  const [isRecording, setIsRecording] = useState(false);

  /**
   * Handle voice recording toggle
   */
  const handleToggleRecording = () => {
    if (!features.audioInput) {
      // Show message that audio input is disabled
      return;
    }
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording
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
            <h2 className="text-lg font-semibold text-slate-800" data-testid="chat-title">
              AI Personal Assistant
            </h2>
            <p className="text-sm text-slate-500">
              Powered by GPT-5 with multimodal capabilities
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Recording Button */}
            <Button
              variant="ghost" 
              size="sm"
              onClick={handleToggleRecording}
              className={`p-2 transition-colors ${
                isRecording 
                  ? "text-red-500 hover:text-red-600" 
                  : features.audioInput 
                    ? "text-slate-400 hover:text-slate-600"
                    : "text-slate-300 cursor-not-allowed"
              }`}
              disabled={!features.audioInput}
              data-testid="button-recording"
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
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
      <div className="flex-1">
        <MessageList 
          messages={messages} 
          isLoading={isLoading}
          data-testid="message-list"
        />
      </div>

      {/* Input Area */}
      <InputArea
        features={features}
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        data-testid="input-area"
      />
    </div>
  );
}
