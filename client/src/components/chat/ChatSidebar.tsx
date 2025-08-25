import { Clock, Database, Download, Globe } from "lucide-react";
import { FeatureToggle } from "@/components/ui/FeatureToggle";

interface ChatSidebarProps {
  features: {
    chat: boolean;
    knowledgeBase: boolean;
    imageGeneration: boolean;
    audioInput: boolean;
    textToSpeech: boolean;
    moderation: boolean;
  };
  onFeatureToggle: (feature: string, enabled: boolean) => void;
  statistics: {
    messagesCount: number;
    imagesGenerated: number;
    audioTranscriptions: number;
    knowledgeBaseQueries: number;
    moderationChecks: number;
    tokensUsed: number;
  };
  connectionStatus: string;
  isConnected: boolean;
}

/**
 * Chat Sidebar Component
 * @description Left sidebar showing development progress, feature toggles, and status
 */
export function ChatSidebar({
  features,
  onFeatureToggle,
  statistics,
  connectionStatus,
  isConnected,
}: ChatSidebarProps) {
  
  // Development weeks progress data
  const weekProgress = [
    { 
      week: 1, 
      title: "Chat Basics", 
      completed: true,
      description: "Basic chat functionality with OpenAI GPT-5"
    },
    { 
      week: 2, 
      title: "Embeddings", 
      completed: true,
      description: "Knowledge base with document search"
    },
    { 
      week: 3, 
      title: "Multimedia", 
      completed: true,
      description: "Images, audio, and content moderation"
    },
    { 
      week: 4, 
      title: "Integration", 
      completed: true,
      description: "Unified AI assistant with all features"
    },
  ];

  const featureList = [
    {
      key: "chat",
      label: "Chat",
      icon: "💬",
      color: "bg-blue-500",
      enabled: features.chat,
    },
    {
      key: "knowledgeBase",
      label: "Knowledge Base",
      icon: "📚",
      color: "bg-green-500",
      enabled: features.knowledgeBase,
    },
    {
      key: "imageGeneration", 
      label: "Image Gen",
      icon: "🎨",
      color: "bg-purple-500",
      enabled: features.imageGeneration,
    },
    {
      key: "audioInput",
      label: "Audio I/O",
      icon: "🎤",
      color: "bg-orange-500",
      enabled: features.audioInput,
    },
    {
      key: "textToSpeech",
      label: "Text-to-Speech",
      icon: "🔊",
      color: "bg-indigo-500", 
      enabled: features.textToSpeech,
    },
    {
      key: "moderation",
      label: "Moderation",
      icon: "🛡️",
      color: "bg-red-500",
      enabled: features.moderation,
    },
  ];

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800" data-testid="app-title">
              AI Assistant POC
            </h1>
            <p className="text-sm text-slate-500">OpenAI Node.js Integration</p>
          </div>
        </div>
      </div>

      {/* Week Progress */}
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Development Progress</h3>
        <div className="space-y-3">
          {weekProgress.map((week) => (
            <div 
              key={week.week} 
              className="flex items-center space-x-3"
              data-testid={`week-progress-${week.week}`}
            >
              <div className={`w-3 h-3 rounded-full ${
                week.completed ? "bg-green-500" : "bg-slate-300"
              }`} />
              <span className="text-sm text-slate-600 flex-1">
                Week {week.week}: {week.title}
              </span>
              {week.completed && (
                <span className="text-green-500 text-xs">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Features Panel */}
      <div className="p-6 flex-1">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Available Features</h3>
        <div className="space-y-3">
          {featureList.map((feature) => (
            <FeatureToggle
              key={feature.key}
              label={feature.label}
              icon={feature.icon}
              enabled={feature.enabled}
              color={feature.color}
              onChange={(enabled) => onFeatureToggle(feature.key, enabled)}
              data-testid={`toggle-${feature.key}`}
            />
          ))}
        </div>
      </div>

      {/* Status Footer */}
      <div className="p-6 border-t border-slate-200">
        <div className="space-y-2">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`} />
            <span className="text-xs text-slate-500" data-testid="connection-status">
              {connectionStatus}
            </span>
          </div>
          
          {/* Token Usage */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full" />
            <span className="text-xs text-slate-500" data-testid="token-usage">
              Tokens used: {statistics.tokensUsed.toLocaleString()}
            </span>
          </div>

          {/* Messages Count */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-xs text-slate-500" data-testid="message-count">
              Messages: {statistics.messagesCount}
            </span>
          </div>

          {/* Images Generated */}
          {statistics.imagesGenerated > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-xs text-slate-500" data-testid="images-generated">
                Images: {statistics.imagesGenerated}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
