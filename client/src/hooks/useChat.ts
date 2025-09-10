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
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
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
    mutationFn: async ({ message, options, useStreaming }: { 
      message: string; 
      options?: { enableTTS?: boolean; ttsVoice?: string };
      useStreaming?: boolean;
    }) => {
      setIsStreaming(useStreaming || false);
      // Add user message immediately
      const userMessage = {
        id: `user_${Date.now()}`,
        role: "user" as const,
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      if (useStreaming) {
        // Handle streaming response
        const response = await api.sendIntegratedMessageStream({
          message,
          sessionId,
          enableTTS: options?.enableTTS,
          ttsVoice: options?.ttsVoice,
        });

        if (!response.body) {
          throw new Error("No response body for streaming");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let assistantMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant" as const,
          content: "",
          timestamp: new Date(),
          image: undefined as any,
          audio: undefined as any,
          sources: undefined as any,
          isStreaming: true, // Flag to indicate streaming in progress
        };

        // Add empty assistant message that will be updated
        setMessages(prev => [...prev, assistantMessage]);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data.trim() === '') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === "chunk" && parsed.content) {
                    // Update the assistant message content
                    assistantMessage.content += parsed.content;
                    assistantMessage.id = parsed.messageId || assistantMessage.id;
                    
                    // Update the message in state
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === "assistant") {
                        newMessages[newMessages.length - 1] = { ...assistantMessage };
                      }
                      return newMessages;
                    });
                  } else if (parsed.type === "complete" && parsed.message) {
                    // Final message update - remove streaming flag
                    assistantMessage = {
                      ...assistantMessage,
                      id: parsed.message.id || assistantMessage.id,
                      content: parsed.message.content || assistantMessage.content,
                      isStreaming: false, // Streaming is complete
                    };
                    
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === "assistant") {
                        newMessages[newMessages.length - 1] = { ...assistantMessage };
                      }
                      return newMessages;
                    });
                  } else if (parsed.type === "image" && parsed.image) {
                    // Add image to the assistant message
                    assistantMessage.image = {
                      url: parsed.image.url,
                      prompt: parsed.image.prompt,
                    };
                    
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === "assistant") {
                        newMessages[newMessages.length - 1] = { ...assistantMessage };
                      }
                      return newMessages;
                    });

                    toast({
                      title: "Image Generated",
                      description: "Your image has been generated successfully!",
                    });
                  } else if (parsed.type === "audio" && parsed.audio) {
                    // Add audio to the assistant message
                    assistantMessage.audio = {
                      url: `/api/audio/file/${parsed.audio.filename}`,
                      filename: parsed.audio.filename,
                    };
                    
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === "assistant") {
                        newMessages[newMessages.length - 1] = { ...assistantMessage };
                      }
                      return newMessages;
                    });
                  } else if (parsed.type === "knowledgeBase" && parsed.knowledgeBase) {
                    // Add knowledge base sources
                    assistantMessage.sources = parsed.knowledgeBase.sources;
                    
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage && lastMessage.role === "assistant") {
                        newMessages[newMessages.length - 1] = { ...assistantMessage };
                      }
                      return newMessages;
                    });
                  } else if (parsed.type === "moderation" && parsed.moderation?.flagged) {
                    toast({
                      title: "Content Moderated",
                      description: "Your message was flagged by content moderation.",
                      variant: "destructive",
                    });
                  } else if (parsed.type === "error") {
                    throw new Error(parsed.error || "Streaming error occurred");
                  }
                } catch (parseError) {
                  console.error("Error parsing streaming data:", parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        return { success: true, streaming: true };
      } else {
        // Handle non-streaming response (existing logic)
        const response = await api.sendIntegratedMessage({
          message,
          sessionId,
          enableTTS: options?.enableTTS,
          ttsVoice: options?.ttsVoice,
        });

        return response;
      }
    },
    onSuccess: (response) => {
      console.log("onSuccess triggered")
      // Only handle non-streaming responses here
      if (response.streaming) {
        return; // Streaming responses are handled in the mutationFn
      }
      
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
    options?: { enableTTS?: boolean; ttsVoice?: string; useStreaming?: boolean }
  ) => {
    await sendMessageMutation.mutateAsync({ 
      message, 
      options: { enableTTS: options?.enableTTS, ttsVoice: options?.ttsVoice },
      useStreaming: options?.useStreaming 
    });
  }, [sendMessageMutation]);

  console.log("isStreaming", isStreaming)

  return {
    messages,
    isLoading: sendMessageMutation.isPending && !isStreaming,
    sendMessage,
    clearHistory,
    initializeChat,
  };
}
