"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Loader2, Copy, Check, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageAnalyzerProps {
  onDescriptionGenerated: (description: string) => void;
}

export function ImageAnalyzer({ onDescriptionGenerated }: ImageAnalyzerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      setPreview(dataUri);
      setDescription(null);
      setCopied(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const analyzeImage = async () => {
    if (!preview) return;

    setAnalyzing(true);
    try {
      const res = await fetch("/api/describe-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await res.json();
      setDescription(data.description);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to analyze image");
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToAppearance = () => {
    if (description) {
      onDescriptionGenerated(description);
      setCopied(true);
      toast.success("Description copied to Appearance field");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setDescription(null);
    setCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Reverse-Engineer Appearance from Image</p>
        </div>

        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8
              cursor-pointer transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
            `}
          >
            <Upload className={`h-8 w-8 mb-3 ${isDragging ? "text-primary" : "text-muted-foreground/50"}`} />
            <p className="text-sm font-medium">
              {isDragging ? "Drop image here" : "Drag & drop an image"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP up to 10MB</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={preview}
                alt="Uploaded reference"
                className="w-full max-h-64 object-contain rounded-lg bg-muted"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={clearImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {!description ? (
              <Button
                onClick={analyzeImage}
                disabled={analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing appearance...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Describe Appearance
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm leading-relaxed">{description}</p>
                </div>
                <Button onClick={copyToAppearance} className="w-full" variant={copied ? "outline" : "default"}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied to Appearance
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Use as Appearance Description
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
