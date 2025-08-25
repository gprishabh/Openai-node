import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatArea } from "@/components/chat/ChatArea";
import { useChat } from "@/hooks/useChat";
import { useOpenAI } from "@/hooks/useOpenAI";

/**
 * Home Page Component
 * @description Main page containing the AI Personal Assistant chat interface
 * Manages overall layout and state coordination between sidebar and chat area
 */
export default function Home() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Chat management
  const {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
    initializeChat,
  } = useChat(sessionId);

  // OpenAI feature management
  const {
    features,
    updateFeatures,
    statistics,
    isConnected,
    connectionStatus,
  } = useOpenAI(sessionId);

  // Initialize chat session on mount
  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  /**
   * Handle feature toggle changes from sidebar
   */
  const handleFeatureToggle = (feature: string, enabled: boolean) => {
    updateFeatures({
      ...features,
      [feature]: enabled,
    });
  };

  /**
   * Handle sending messages from chat area
   */
  const handleSendMessage = async (message: string, options?: {
    enableTTS?: boolean;
    ttsVoice?: string;
  }) => {
    await sendMessage(message, options);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <ChatSidebar
        features={features}
        onFeatureToggle={handleFeatureToggle}
        statistics={statistics}
        connectionStatus={connectionStatus}
        isConnected={isConnected}
        data-testid="chat-sidebar"
      />
      
      {/* Main Chat Area */}
      <ChatArea
        sessionId={sessionId}
        messages={messages}
        isLoading={isLoading}
        features={features}
        onSendMessage={handleSendMessage}
        onClearHistory={clearHistory}
        data-testid="chat-area"
      />
    </div>
  );
}
