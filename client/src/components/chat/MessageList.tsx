import { useEffect, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: {
    url: string;
    prompt: string;
  };
  audio?: {
    url: string;
    filename: string;
  };
  sources?: Array<{
    filename: string;
    similarity: number;
    snippet: string;
  }>;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

/**
 * Message List Component
 * @description Displays chat messages with support for text, images, audio, and sources
 */
export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Handle image download
   */
  const handleDownloadImage = async (url: string, prompt: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  /**
   * Handle audio playback
   */
  const handlePlayAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(console.error);
  };

  /**
   * Render message content with formatting
   */
  const renderMessageContent = (content: string) => {
    // Simple formatting for code blocks
    const parts = content.split(/```(\w+)?\n([\s\S]*?)```/);
    
    return parts.map((part, index) => {
      if (index % 3 === 2) {
        // This is code content
        return (
          <div key={index} className="bg-slate-50 rounded-lg p-3 border my-3">
            <pre className="text-sm text-slate-600 overflow-x-auto">
              <code>{part}</code>
            </pre>
          </div>
        );
      } else if (index % 3 === 1) {
        // This is language identifier, skip
        return null;
      } else {
        // Regular text
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto" data-testid="messages-container">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Message */}
        {messages.length === 0 && !isLoading && (
          <div className="flex items-start space-x-4">
            <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600">
              <AvatarFallback className="text-white text-sm">🤖</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-sm border border-slate-200">
                <p className="text-slate-700">
                  Welcome to your AI Personal Assistant POC! I can help you with:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  <li>• General conversations and questions</li>
                  <li>• Knowledge base queries from uploaded documents</li>
                  <li>• Image generation from text prompts</li>
                  <li>• Audio transcription and text-to-speech</li>
                  <li>• Content moderation and safety checks</li>
                </ul>
              </div>
              <p className="text-xs text-slate-400 mt-2">Just now</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex items-start space-x-4 ${
              message.role === "user" ? "justify-end" : ""
            }`}
            data-testid={`message-${message.id}`}
          >
            {message.role === "assistant" && (
              <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600">
                <AvatarFallback className="text-white text-sm">🤖</AvatarFallback>
              </Avatar>
            )}
            
            <div className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}>
              <div className={`rounded-xl p-4 max-w-2xl ${
                message.role === "user" 
                  ? "bg-blue-500 text-white rounded-tr-none" 
                  : "bg-white shadow-sm border border-slate-200 rounded-tl-none"
              }`}>
                {/* Text Content */}
                <div className={message.role === "user" ? "text-white" : "text-slate-700"}>
                  {renderMessageContent(message.content)}
                </div>

                {/* Image Content */}
                {message.image && (
                  <div className="mt-3">
                    <img 
                      src={message.image.url} 
                      alt={message.image.prompt}
                      className="rounded-lg w-full max-w-md shadow-sm"
                      data-testid="generated-image"
                    />
                    <div className="flex items-center space-x-4 mt-3 text-xs text-slate-500">
                      <span>Generated with DALL-E 3</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadImage(message.image!.url, message.image!.prompt)}
                        className="h-auto p-0 text-xs hover:text-slate-700 transition-colors"
                        data-testid="button-download-image"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Audio Content */}
                {message.audio && (
                  <div className="mt-3">
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlayAudio(message.audio!.url)}
                          className="h-auto p-1"
                          data-testid="button-play-audio"
                        >
                          ▶️ Play Audio
                        </Button>
                        <span className="text-sm text-slate-600">{message.audio.filename}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Knowledge Base Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-2">Sources:</p>
                    <div className="space-y-2">
                      {message.sources.map((source, index) => (
                        <div 
                          key={index} 
                          className="bg-slate-50 rounded p-2 text-xs"
                          data-testid={`source-${index}`}
                        >
                          <div className="font-medium text-slate-700">
                            {source.filename} ({Math.round(source.similarity * 100)}% match)
                          </div>
                          <div className="text-slate-500 mt-1">
                            {source.snippet}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-slate-400 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>

            {message.role === "user" && (
              <Avatar className="w-8 h-8 bg-slate-200">
                <AvatarFallback className="text-slate-600 text-sm">👤</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-4" data-testid="typing-indicator">
            <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600">
              <AvatarFallback className="text-white text-sm">🤖</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-white rounded-xl rounded-tl-none p-4 shadow-sm border border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
