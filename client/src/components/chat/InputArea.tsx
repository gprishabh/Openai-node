import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/ui/FileUpload";
import { Send, Mic, X } from "lucide-react";
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{
    id: string;
    filename: string;
    uploadDate: Date;
    chunkCount: number;
  }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

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

  // Load documents on component mount and when knowledge base feature changes
  useEffect(() => {
    if (features.knowledgeBase) {
      fetchUploadedDocuments();
    } else {
      setUploadedDocuments([]);
    }
  }, [features.knowledgeBase]);

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
    if (!features.audioInput) {
      toast({
        title: "Audio Input Disabled",
        description: "Please enable the audio input feature to upload audio files.",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Implement audio transcription
    toast({
      title: "Audio Upload",
      description: "Audio transcription feature coming soon!",
    });
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
                disabled={isLoading || !features.chat}
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
