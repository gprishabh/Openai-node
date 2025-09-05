
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
import { X, Copy, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AudioTranscription } from "./ChatArea";

interface TranscriptionItemProps {
    transcription: AudioTranscription;
    onRemove: (id: string) => void;
    onCopy: (text: string) => void;
    onUse: (text: string) => void;
    chatEnabled: boolean;
    setMessage: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Individual Transcription Item Component
 */
export function TranscriptionItem({ transcription, onRemove, onCopy, onUse, chatEnabled, setMessage }: TranscriptionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = transcription.text.length > 200;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800 truncate">
            {transcription.filename.length > 14
              ? `...${transcription.filename.slice(-14)}`
              : transcription.filename}
          </p>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
              {transcription.language}
            </span>
            <span>{transcription.duration > 0 ? `${transcription.duration}s` : 'Unknown'}</span>
            <span className={`px-1.5 py-0.5 rounded ${
              transcription.confidence > 0.8 
                ? 'bg-green-100 text-green-700' 
                : transcription.confidence > 0.6 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
            }`}>
              {Math.round(transcription.confidence * 100)}%
            </span>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 text-slate-400 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Audio Transcription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this audio transcription? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRemove(transcription.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="bg-slate-50 p-3 rounded border text-sm text-slate-700 mb-3">
        <div 
          className={`${!isExpanded && shouldTruncate ? 'cursor-pointer hover:bg-slate-100 rounded p-1 -m-1' : ''}`}
          onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}
        >
          {!isExpanded && shouldTruncate 
            ? `${transcription.text.substring(0, 200)}...` 
            : transcription.text
          }
        </div>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-600 text-xs mt-2 font-medium"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCopy(transcription.text)}
          className="flex-1 text-xs h-7 hover:bg-slate-50"
        >
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMessage(transcription.text)}
          disabled={!chatEnabled}
          className={`flex-1 text-xs h-7 ${chatEnabled ? "hover:bg-blue-50" : "cursor-not-allowed"}`}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add to chat
        </Button>
      </div>
      
      <p className="text-xs text-slate-400 mt-2 border-t border-slate-100 pt-2">
        {new Date(transcription.timestamp).toLocaleDateString()} • {Math.round(transcription.fileSize / 1024)} KB
      </p>
    </div>
  );
}