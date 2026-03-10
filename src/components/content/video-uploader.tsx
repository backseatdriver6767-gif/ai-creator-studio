"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Film, Loader2, CheckCircle } from "lucide-react";

interface VideoUploaderProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  isCompleted?: boolean;
  currentVideoUrl?: string | null;
}

export function VideoUploader({ onUpload, isUploading, isCompleted, currentVideoUrl }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.match(/^video\/(mp4|quicktime)$/)) return;
    if (file.size > 500 * 1024 * 1024) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUploadClick = () => {
    if (selectedFile) onUpload(selectedFile);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Completed state: green checkmark + video thumbnail
  if (isCompleted && selectedFile && previewUrl) {
    return (
      <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-semibold text-green-700">Video Ready</span>
        </div>
        <video src={previewUrl} className="w-full max-w-sm rounded-lg" muted playsInline />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Film className="h-4 w-4" />
            <span className="truncate max-w-xs">{selectedFile.name}</span>
            <span className="text-green-600">{formatSize(selectedFile.size)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Change Video
          </Button>
        </div>
      </div>
    );
  }

  // Existing video from server
  if (currentVideoUrl && !selectedFile) {
    return (
      <div className="space-y-3">
        <video src={currentVideoUrl} controls className="w-full max-w-md rounded-lg" />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          Replace Video
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          className="hidden"
        />
      </div>
    );
  }

  // Upload flow: drag zone → preview → upload button
  return (
    <div className="space-y-3">
      {!selectedFile ? (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8
              cursor-pointer transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
            `}
          >
            <Upload className={`h-8 w-8 mb-3 ${isDragging ? "text-primary" : "text-muted-foreground/50"}`} />
            <p className="text-sm font-medium">
              {isDragging ? "Drop your video here" : "Drag & drop your MP4 here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              MP4 or MOV, up to 500MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            className="hidden"
          />
        </>
      ) : (
        <div className="space-y-3">
          <video src={previewUrl!} controls className="w-full max-w-md rounded-lg" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Film className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-xs">{selectedFile.name}</span>
              <span className="text-muted-foreground">{formatSize(selectedFile.size)}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={clearSelection} disabled={isUploading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleUploadClick} disabled={isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
