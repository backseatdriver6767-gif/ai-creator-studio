"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, ImageIcon, Film, FileIcon } from "lucide-react";

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  size: number;
}

interface MediaUploaderProps {
  files: MediaFile[];
  onChange: (files: MediaFile[]) => void;
  maxFiles?: number;
}

export function MediaUploader({ files, onChange, maxFiles = 10 }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (newFiles: FileList) => {
      const remaining = maxFiles - files.length;
      if (remaining <= 0) return;

      const toProcess = Array.from(newFiles).slice(0, remaining);

      toProcess.forEach((file) => {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
        if (file.size > 100 * 1024 * 1024) return; // 100MB limit

        const reader = new FileReader();
        reader.onload = (e) => {
          const mediaFile: MediaFile = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: file.name,
            type: file.type,
            dataUrl: e.target?.result as string,
            size: file.size,
          };
          onChange([...files, mediaFile]);
        };
        reader.readAsDataURL(file);
      });
    },
    [files, maxFiles, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const removeFile = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getIcon = (type: string) => {
    if (type.startsWith("video/")) return Film;
    if (type.startsWith("image/")) return ImageIcon;
    return FileIcon;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reference Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Drag and drop images or videos to use as visual references for AI content generation
          (product shots, backgrounds, style references, etc.)
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6
            cursor-pointer transition-colors
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
          `}
        >
          <Upload className={`h-6 w-6 mb-2 ${isDragging ? "text-primary" : "text-muted-foreground/50"}`} />
          <p className="text-sm font-medium">
            {isDragging ? "Drop files here" : "Drag & drop images or videos"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, WebP, MP4, MOV &middot; up to 100MB each &middot; {files.length}/{maxFiles} files
          </p>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {files.map((file) => {
              const Icon = getIcon(file.type);
              return (
                <div
                  key={file.id}
                  className="relative group rounded-lg border overflow-hidden bg-muted"
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 flex flex-col items-center justify-center">
                      <Icon className="h-8 w-8 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground truncate max-w-[90%]">{file.name}</p>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 flex items-center justify-between">
                    <span className="text-xs text-white truncate max-w-[70%]">{file.name}</span>
                    <span className="text-xs text-white/70">{formatSize(file.size)}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => { if (e.target.files) processFiles(e.target.files); }}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
