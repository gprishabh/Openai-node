import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

/**
 * Chat Management Hook
 * @description Manages chat state, message sending, and history
 */
export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize chat session
  const initializeChat = useCallback(async () => {
    try {
      const response = await api.initializeChat(sessionId);
      if (response.success && response.message) {
        setMessages([response.message]);
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session",
        variant: "destructive",
      });
    }
  }, [sessionId, toast]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, options }: { 
      message: string; 
      options?: { enableTTS?: boolean; ttsVoice?: string } 
    }) => {
      // Add user message immediately
      const userMessage = {
        id: `user_${Date.now()}`,
        role: "user" as const,
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to integrated endpoint
      const response = await api.sendIntegratedMessage({
        message,
        sessionId,
        enableTTS: options?.enableTTS,
        ttsVoice: options?.ttsVoice,
      });

      return response;
    },
    onSuccess: (response) => {
      if (response.success && response.response) {
        const assistantMessage = {
          id: response.response.chat?.id || `assistant_${Date.now()}`,
          role: "assistant" as const,
          content: response.response.chat?.content || "I apologize, but I couldn't generate a response.",
          timestamp: new Date(),
          image: response.response.image ? {
            url: response.response.image.url,
            prompt: response.response.image.prompt,
          } : undefined,
          audio: response.response.audio ? {
            url: `/api/audio/file/${response.response.audio.filename}`,
            filename: response.response.audio.filename,
          } : undefined,
          sources: response.response.knowledgeBase?.sources,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Show toast for special responses
        if (response.response.image) {
          toast({
            title: "Image Generated",
            description: "Your image has been generated successfully!",
          });
        }

        if (response.response.moderation?.flagged) {
          toast({
            title: "Content Moderated",
            description: "Your message was flagged by content moderation.",
            variant: "destructive",
          });
        }
      }
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Clear chat history
  const clearHistory = useCallback(async () => {
    try {
      await api.clearChatHistory(sessionId);
      setMessages([]);
      
      // Re-initialize with welcome message
      await initializeChat();
      
      toast({
        title: "Chat Cleared",
        description: "Chat history has been cleared.",
      });
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast({
        title: "Error", 
        description: "Failed to clear chat history.",
        variant: "destructive",
      });
    }
  }, [sessionId, initializeChat, toast]);

  // Send message function
  const sendMessage = useCallback(async (
    message: string, 
    options?: { enableTTS?: boolean; ttsVoice?: string }
  ) => {
    await sendMessageMutation.mutateAsync({ message, options });
  }, [sendMessageMutation]);

  return {
    messages,
    isLoading: sendMessageMutation.isPending,
    sendMessage,
    clearHistory,
    initializeChat,
  };
}
