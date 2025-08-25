import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/FileUpload";
import { Send, Mic } from "lucide-react";

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
}

/**
 * Input Area Component
 * @description Message input with file upload, voice recording, and options
 */
export function InputArea({ features, onSendMessage, isLoading }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [streamResponse, setStreamResponse] = useState(true);
  const [enableTTS, setEnableTTS] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    setMessage(action);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  /**
   * Handle voice input toggle
   */
  const handleVoiceToggle = () => {
    if (!features.audioInput) return;
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording
  };

  /**
   * Handle file uploads
   */
  const handleDocumentUpload = async (files: FileList) => {
    // TODO: Implement document upload to knowledge base
    console.log("Document upload:", files);
  };

  const handleAudioUpload = async (files: FileList) => {
    // TODO: Implement audio transcription
    console.log("Audio upload:", files);
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
            disabled={!features.knowledgeBase}
            className={`h-20 ${!features.knowledgeBase ? "opacity-50" : ""}`}
            data-testid="upload-documents"
          >
            <div className="text-center">
              <span className="text-lg mb-2 block">📄</span>
              <p className="text-sm text-slate-500">Upload documents for knowledge base</p>
              <p className="text-xs text-slate-400">.txt, .pdf, .docx supported</p>
            </div>
          </FileUpload>

          {/* Audio Upload */}
          <FileUpload
            accept="audio/*"
            onUpload={handleAudioUpload}
            disabled={!features.audioInput}
            className={`h-20 ${!features.audioInput ? "opacity-50" : ""}`}
            data-testid="upload-audio"
          >
            <div className="text-center">
              <span className="text-lg mb-2 block">🎤</span>
              <p className="text-sm text-slate-500">Upload audio for transcription</p>
              <p className="text-xs text-slate-400">.mp3, .wav, .m4a supported</p>
            </div>
          </FileUpload>
        </div>

        {/* Message Input */}
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message, ask about uploaded documents, request an image, or use voice input..."
                className="resize-none rounded-xl border border-slate-300 px-4 py-3 pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                rows={1}
                maxLength={4000}
                disabled={isLoading}
                data-testid="input-message"
              />
              
              {/* Voice Recording Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                disabled={!features.audioInput}
                className={`absolute right-3 top-3 p-1 transition-colors ${
                  isRecording 
                    ? "text-red-500 hover:text-red-600" 
                    : features.audioInput 
                      ? "text-slate-400 hover:text-orange-500"
                      : "text-slate-300 cursor-not-allowed"
                }`}
                data-testid="button-voice-input"
              >
                <Mic className="h-4 w-4" />
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
            disabled={!message.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-full transition-colors border-0"
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
