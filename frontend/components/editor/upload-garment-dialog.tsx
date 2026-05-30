"use client";

import * as React from "react";
import { Upload, X, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface UploadGarmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message?: string) => void;
}

export function UploadGarmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadGarmentDialogProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Clean up preview URL when component unmounts or file changes
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle dialog close and reset state
  React.useEffect(() => {
    if (!open) {
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setNotes("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile: File): boolean => {
    setError(null);
    
    // Type validation
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Only PNG, JPG, and WEBP are supported.");
      return false;
    }

    // Size validation (10MB)
    const maxBytes = 10 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setError("File is too large. Maximum size allowed is 10MB.");
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (loading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setPreviewUrl(URL.createObjectURL(droppedFile));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (loading) return;

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    }
  };

  const onButtonClick = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (notes.trim()) {
      formData.append("notes", notes.trim());
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Upload failed. Please try again.");
      }

      onSuccess("Garment uploaded successfully.");
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent
        className={cn(
          "bg-card border border-border/40 rounded-none p-8 max-w-[calc(100%-2rem)] sm:max-w-[480px] shadow-xl outline-none ring-0 [&_[data-slot=dialog-close]]:rounded-none [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:text-muted-foreground [&_[data-slot=dialog-close]]:hover:text-foreground",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        )}
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="font-serif text-2xl font-semibold text-foreground tracking-tight select-none">
            Add New Piece
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground leading-relaxed mt-1">
            Upload an image of your garment. Our AI will automatically remove the background and extract the metadata tags.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 font-sans text-foreground flex flex-col gap-6">
          {/* File Upload Zone */}
          <div
            className={cn(
              "border border-dashed rounded-none transition-all duration-300 relative flex flex-col items-center justify-center p-8 text-center cursor-pointer min-h-[200px]",
              dragActive
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-border/80 bg-background/50 hover:bg-background/80",
              loading && "opacity-70 pointer-events-none cursor-not-allowed"
            )}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleChange}
              disabled={loading}
            />

            {previewUrl ? (
              <div className="w-full flex flex-col items-center gap-3 relative">
                <div className="aspect-[4/5] w-36 max-w-full bg-[#fcf9f5] border border-border/30 relative flex items-center justify-center overflow-hidden group shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Selected garment preview"
                    className="w-full h-full object-contain"
                  />
                  {!loading && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background text-foreground border border-border/40 p-1 rounded-none hover:scale-105 transition-all shadow-sm"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">
                  {file?.name}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-accent/40 text-primary p-3 rounded-none mb-3 transition-transform duration-300 group-hover:scale-105">
                  <Upload className="w-5 h-5 stroke-[1.5]" />
                </div>
                <p className="text-sm font-medium text-foreground">Click to upload or drag image</p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  PNG, JPG, WEBP — up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Notes Input */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="dialog-notes"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none"
            >
              Additional Notes
            </label>
            <Textarea
              id="dialog-notes"
              placeholder="Add optional notes about fit, fabric, or styling…"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              disabled={loading}
              maxLength={500}
              className="resize-none h-24 rounded-none bg-background/40 border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60 placeholder:text-muted-foreground/60 transition-all"
            />
            <div className="flex justify-end">
              <span className="text-[10px] text-muted-foreground/70">
                {500 - notes.length} characters remaining
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-3 rounded-none animate-fade-in">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className="rounded-none px-5 border-border/60 hover:bg-accent/40 text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || loading}
              className="rounded-none px-6 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Process Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
