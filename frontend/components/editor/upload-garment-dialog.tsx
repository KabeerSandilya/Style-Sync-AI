"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { Upload, X, Loader2, Sparkles, Heart, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface UploadGarmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message?: string) => void;
}

const VALID_CATEGORIES = [
  "Topwear",
  "Bottomwear",
  "Outerwear",
  "Footwear",
  "Accessories",
  "Formalwear",
  "Sportswear",
  "Ethnicwear",
  "Uncategorized",
];

const SUGGESTED_TAGS = [
  "casual",
  "formal",
  "winter",
  "summer",
  "oversized",
  "streetwear",
  "minimal",
  "gym",
  "party",
  "cotton",
  "denim",
];

export function UploadGarmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadGarmentDialogProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Client-side background removal state
  type BgState = "idle" | "processing" | "done" | "failed";
  const [bgState, setBgState] = React.useState<BgState>("idle");
  const [bgProgress, setBgProgress] = React.useState(0); // 0-100
  const [processedBlob, setProcessedBlob] = React.useState<Blob | null>(null);
  const [processedPreviewUrl, setProcessedPreviewUrl] = React.useState<string | null>(null);
  // Used to discard stale BG removal results if user swaps file mid-flight
  const bgJobId = React.useRef(0);

  // Clothing Metadata States
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Uncategorized");
  const [tags, setTags] = React.useState<string[]>([]);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [newTagInput, setNewTagInput] = React.useState("");

  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Start client-side background removal as soon as a file is picked.
  // Runs in parallel while the user fills in name/notes — free and works on Vercel.
  const startBgRemoval = React.useCallback(async (selectedFile: File) => {
    const jobId = ++bgJobId.current;
    setBgState("processing");
    setBgProgress(0);
    setProcessedBlob(null);
    if (processedPreviewUrl) {
      URL.revokeObjectURL(processedPreviewUrl);
      setProcessedPreviewUrl(null);
    }

    try {
      // Dynamic import keeps the WASM bundle out of the initial page load
      const { removeBackground } = await import("@imgly/background-removal");

      const result = await removeBackground(selectedFile, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) setBgProgress(Math.round((current / total) * 100));
        },
      });

      // Discard if user picked a different file while this was running
      if (jobId !== bgJobId.current) return;

      const url = URL.createObjectURL(result);
      setProcessedBlob(result);
      setProcessedPreviewUrl(url);
      setBgState("done");
    } catch (err) {
      if (jobId !== bgJobId.current) return;
      console.warn("[BG removal] client-side failed, server will handle it:", err);
      setBgState("failed");
    }
  }, [processedPreviewUrl]);

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
      bgJobId.current++; // invalidate any in-flight BG job
      setFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (processedPreviewUrl) {
        URL.revokeObjectURL(processedPreviewUrl);
        setProcessedPreviewUrl(null);
      }
      setProcessedBlob(null);
      setBgState("idle");
      setBgProgress(0);
      setName("");
      setCategory("Uncategorized");
      setTags([]);
      setIsFavorite(false);
      setNewTagInput("");
      setNotes("");
      setError(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const selectFile = (selectedFile: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    startBgRemoval(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (loading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) selectFile(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (loading) return;

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) selectFile(selectedFile);
    }
  };

  const onButtonClick = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    bgJobId.current++; // invalidate any in-flight BG job
    setFile(null);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    if (processedPreviewUrl) { URL.revokeObjectURL(processedPreviewUrl); setProcessedPreviewUrl(null); }
    setProcessedBlob(null);
    setBgState("idle");
    setBgProgress(0);
    setError(null);
  };

  // Add Tag chip
  const handleAddTag = (tagText: string) => {
    const cleaned = tagText.trim().toLowerCase().replace(/#/g, "");
    if (!cleaned) return;
    if (!tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setNewTagInput("");
  };

  // Remove Tag chip
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    // If client-side BG removal succeeded, send the processed PNG.
    // The server will upload it directly and skip its own BG removal job.
    if (processedBlob) {
      formData.append("processedImageFile", processedBlob, "processed.png");
    }

    if (name.trim()) {
      formData.append("name", name.trim());
    }
    formData.append("category", category);
    formData.append("tags", tags.join(","));
    formData.append("isFavorite", isFavorite ? "true" : "false");

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
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent
        className={cn(
          "bg-card border border-border/40 rounded-none p-8 max-w-[calc(100%-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto shadow-xl outline-none ring-0 [&_[data-slot=dialog-close]]:rounded-none [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:text-muted-foreground [&_[data-slot=dialog-close]]:hover:text-foreground",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        )}
      >
        <DialogHeader className="gap-2 text-left pb-2 border-b border-border/20">
          <DialogTitle className="font-serif text-2xl font-semibold text-foreground tracking-tight select-none">
            Add New Piece
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-muted-foreground leading-relaxed mt-1">
            Upload an image of your garment and add its wardrobe details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 font-sans text-foreground flex flex-col gap-6">
          
          {/* File Upload Zone / Preview Container */}
          <div
            className={cn(
              "border border-dashed rounded-none transition-all duration-300 relative flex flex-col items-center justify-center p-8 text-center cursor-pointer min-h-[180px]",
              dragActive
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-border/80 bg-background/50 hover:bg-background/80",
              previewUrl ? "cursor-default hover:bg-background/50" : "",
              loading && "opacity-70 pointer-events-none cursor-not-allowed"
            )}
            onDragEnter={previewUrl ? undefined : handleDrag}
            onDragOver={previewUrl ? undefined : handleDrag}
            onDragLeave={previewUrl ? undefined : handleDrag}
            onDrop={previewUrl ? undefined : handleDrop}
            onClick={previewUrl ? undefined : onButtonClick}
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
                  {/* Show processed preview when ready, original otherwise */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedPreviewUrl ?? previewUrl}
                    alt="Selected garment preview"
                    className="w-full h-full object-contain transition-opacity duration-300"
                  />

                  {/* BG removal status badge */}
                  {bgState === "processing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs gap-1.5">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground">
                        {bgProgress < 100 ? `Loading model ${bgProgress}%` : "Processing…"}
                      </span>
                    </div>
                  )}
                  {bgState === "done" && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-primary/90 text-primary-foreground px-2 py-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span className="text-[8px] font-bold uppercase tracking-wider">BG Removed</span>
                    </div>
                  )}

                  {!loading && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background text-foreground border border-border/40 p-1 rounded-none hover:scale-105 transition-all shadow-sm cursor-pointer"
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
                  PNG, JPG, or WEBP, up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Conditional Metadata Inputs: Only displayed when file is selected */}
          {previewUrl && (
            <div className="flex flex-col gap-5 animate-fade-in">
              
              {/* Name Input */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="upload-garment-name"
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none"
                >
                  Garment Name
                </label>
                <Input
                  id="upload-garment-name"
                  placeholder="e.g., Beige Linen Blazer"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 100))}
                  disabled={loading}
                  className="rounded-none bg-background/40 border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-all font-sans text-sm"
                />
              </div>

              {/* Category Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="upload-garment-category"
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none"
                >
                  Category
                </label>
                <select
                  id="upload-garment-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                  className="w-full bg-background/40 text-foreground border border-border/80 px-3 py-2 focus-visible:ring-primary/40 focus:border-primary/60 outline-none text-sm transition-all h-9 select-none cursor-pointer"
                >
                  {VALID_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Favorite toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                  Wardrobe Priority
                </label>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 border transition-all cursor-pointer rounded-full text-xs font-semibold uppercase tracking-wider select-none",
                      isFavorite
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border/80 text-muted-foreground hover:text-foreground"
                    )}
                    disabled={loading}
                  >
                    <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-primary text-primary")} />
                    <span>{isFavorite ? "Featured in Favorites" : "Add to Favorites"}</span>
                  </button>
                </div>
              </div>

              {/* Tag Editing */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-background/30 border border-border/60 rounded-none items-center">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-accent/40 text-accent-foreground px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-none border border-accent/20 select-none"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive text-accent-foreground/60 transition-colors p-0.5 rounded-none cursor-pointer"
                        aria-label={`Remove tag ${tag}`}
                        disabled={loading}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs text-muted-foreground/60 italic px-1 select-none">
                      No tags added.
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Type and press Enter or add..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    disabled={loading}
                    className="text-xs py-1 h-8 rounded-none border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60 font-sans"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddTag(newTagInput)}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-none border-border/60 hover:bg-accent/40 text-xs px-3"
                    disabled={loading}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[9px] text-muted-foreground/75 uppercase tracking-wide font-semibold select-none">
                    Suggested Tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_TAGS.map((tag) => {
                      const isSelected = tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => isSelected ? handleRemoveTag(tag) : handleAddTag(tag)}
                          className={cn(
                            "px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold border rounded-none transition-all cursor-pointer select-none",
                            isSelected
                              ? "bg-[#708272] text-[#fffefb] border-[#708272]"
                              : "border-border/80 text-muted-foreground hover:text-foreground hover:bg-background/80"
                          )}
                          disabled={loading}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
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
                  className="resize-none h-24 rounded-none bg-background/40 border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60 placeholder:text-muted-foreground/60 transition-all font-sans text-sm"
                />
                <div className="flex justify-end select-none">
                  <span className="text-[10px] text-muted-foreground/70">
                    {500 - notes.length} characters remaining
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-3 rounded-none animate-fade-in">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-border/20 select-none">
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
