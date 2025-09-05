import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

/**
 * OpenAI Features Management Hook
 * @description Manages feature states, statistics, and API connectivity
 */
export function useOpenAI(sessionId: string) {
  const [features, setFeatures] = useState({
    chat: true, // Start with Chat enabled by default
    knowledgeBase: true,
    imageGeneration: true,
    audioInput: true,
    textToSpeech: true,
    moderation: true,
  });

  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Fetch session statistics
  const { data: statisticsData } = useQuery({
    queryKey: ["/api/session/stats", sessionId],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!sessionId,
  });

  // Update features mutation
  const updateFeaturesMutation = useMutation({
    mutationFn: async (newFeatures: typeof features) => {
      return api.updateSessionFeatures(sessionId, newFeatures);
    },
    onSuccess: () => {
      toast({
        title: "Features Updated",
        description: "Session features have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to update features:", error);
      toast({
        title: "Error",
        description: "Failed to update features. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update features function
  const updateFeatures = useCallback(async (newFeatures: typeof features) => {
    // Special logic for Chat toggle: when Chat is disabled, disable all other features
    if (!newFeatures.chat && features.chat) {
      // Chat was just disabled, disable all other features
      newFeatures = {
        chat: false,
        knowledgeBase: false,
        imageGeneration: false,
        audioInput: false,
        textToSpeech: false,
        moderation: false,
      };
      
      toast({
        title: "Chat Mode Disabled",
        description: "All advanced features have been disabled. Only basic functionality is available.",
      });
    } else if (newFeatures.chat && !features.chat) {
      // Chat was just enabled, enable some default features
      newFeatures = {
        chat: true,
        knowledgeBase: true,
        imageGeneration: true,
        audioInput: true,
        textToSpeech: true,
        moderation: true,
      };
      
      toast({
        title: "Chat Mode Enabled",
        description: "Advanced AI assistant features are now available. You can toggle individual features in the sidebar.",
      });
    }
    
    setFeatures(newFeatures);
    await updateFeaturesMutation.mutateAsync(newFeatures);
  }, [updateFeaturesMutation, features, toast]);

  // Check API connectivity
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await api.getSystemStatistics();
        if (response.success) {
          setIsConnected(true);
          setConnectionStatus("Connected to OpenAI API");
        } else {
          setIsConnected(false);
          setConnectionStatus("API connection failed");
        }
      } catch (error) {
        setIsConnected(false);
        setConnectionStatus("Unable to connect to API");
      }
    };

    checkConnection();
    
    // Check connection every minute
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  // Process statistics data
  const statistics = {
    messagesCount: (statisticsData as any)?.statistics?.messagesCount || 0,
    imagesGenerated: (statisticsData as any)?.statistics?.imagesGenerated || 0,
    audioTranscriptions: (statisticsData as any)?.statistics?.audioTranscriptions || 0,
    knowledgeBaseQueries: (statisticsData as any)?.statistics?.knowledgeBaseQueries || 0,
    moderationChecks: (statisticsData as any)?.statistics?.moderationChecks || 0,
    tokensUsed: (statisticsData as any)?.statistics?.tokensUsed || 0,
  };

  return {
    features,
    updateFeatures,
    statistics,
    isConnected,
    connectionStatus,
  };
}
