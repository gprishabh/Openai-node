import { useRef } from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  onUpload: (files: FileList) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * File Upload Component
 * @description Reusable drag-and-drop file upload component
 */
export function FileUpload({
  accept,
  multiple = false,
  onUpload,
  disabled = false,
  className,
  children,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = "";
  };

  /**
   * Handle click to trigger file selection
   */
  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "flex items-center justify-center w-full border-2 border-dashed rounded-lg transition-colors cursor-pointer",
        disabled 
          ? "border-slate-200 cursor-not-allowed opacity-50" 
          : "border-slate-300 hover:border-slate-400",
        className
      )}
      data-testid="file-upload"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        data-testid="file-input"
      />
      {children}
    </div>
  );
}
