"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { Upload, X, Loader2, Star, Sparkles } from "lucide-react";
import { EditorialDialog } from "@/components/editor/editorial-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MOOD_TAGS } from "@style-sync/backend/types";
import { useCreateLookBookEntry } from "@/lib/hooks/use-lookbook";

interface AddToLookBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outfitId?: string | null;
  date?: string | null;
  onSuccess?: (message: string) => void;
}

function toDateInputValue(date?: string | null) {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().slice(0, 10);
}

export function AddToLookBookDialog({
  open,
  onOpenChange,
  outfitId = null,
  date = null,
  onSuccess,
}: AddToLookBookDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [mood, setMood] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const createEntry = useCreateLookBookEntry();
  const loading = createEntry.isPending;

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setRating(0);
      setMood([]);
      setNotes("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const validateFile = (selected: File): boolean => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(selected.type)) {
      setError("Invalid file type. Only PNG, JPG, and WEBP are supported.");
      return false;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size allowed is 10MB.");
      return false;
    }
    setError(null);
    return true;
  };

  const selectFile = (selected: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (loading) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && validateFile(dropped)) selectFile(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && validateFile(selected)) selectFile(selected);
  };

  const toggleMood = (tag: string) => {
    setMood((prev) => (prev.includes(tag) ? prev.filter((m) => m !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (!file || rating === 0) {
      setError("Add a photo and a rating before saving.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (outfitId) formData.append("outfitId", outfitId);
    formData.append("date", toDateInputValue(date));
    formData.append("rating", String(rating));
    mood.forEach((m) => formData.append("mood", m));
    if (notes.trim()) formData.append("notes", notes.trim());

    try {
      const result = await createEntry.mutateAsync(formData);
      if (!result.success) throw new Error(result.error || "Failed to save entry.");
      onSuccess?.("Added to your Look Book.");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry.");
    }
  };

  return (
    <EditorialDialog
      open={open}
      onOpenChange={(val) => !loading && onOpenChange(val)}
      title="Add to Look Book"
      description="Capture how this look actually felt: a photo, a mood, a rating."
      footerActions={
        <>
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
            type="button"
            disabled={loading || !file || rating === 0}
            onClick={handleSubmit}
            className="rounded-none px-6 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Save Entry
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Photo picker */}
        <div
          className={cn(
            "border border-dashed rounded-none transition-all duration-300 relative flex flex-col items-center justify-center p-8 text-center cursor-pointer min-h-40",
            dragActive ? "border-primary bg-primary/5 scale-[0.99]" : "border-border/80 bg-background/50 hover:bg-background/80",
            previewUrl ? "cursor-default hover:bg-background/50" : "",
            loading && "opacity-70 pointer-events-none cursor-not-allowed"
          )}
          onDragEnter={previewUrl ? undefined : handleDrag}
          onDragOver={previewUrl ? undefined : handleDrag}
          onDragLeave={previewUrl ? undefined : handleDrag}
          onDrop={previewUrl ? undefined : handleDrop}
          onClick={previewUrl ? undefined : () => fileInputRef.current?.click()}
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
              <div className="aspect-4/5 w-36 max-w-full bg-[#fcf9f5] border border-border/30 relative flex items-center justify-center overflow-hidden shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Selected look preview" className="w-full h-full object-cover" />
                {!loading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background text-foreground border border-border/40 p-1 hover:scale-105 transition-all shadow-sm cursor-pointer"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-medium truncate max-w-50">
                {file?.name}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="bg-accent/40 text-primary p-3 mb-3">
                <Upload className="w-5 h-5 stroke-[1.5]" />
              </div>
              <p className="text-sm font-medium text-foreground">Click to upload or drag a photo</p>
              <p className="text-xs text-muted-foreground mt-1.5">PNG, JPG, or WEBP, up to 10MB</p>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
            How did it feel?
          </label>
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  disabled={loading}
                  className="cursor-pointer"
                  aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      value <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood chips */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
            Mood
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_TAGS.map((tag) => {
              const selected = mood.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleMood(tag)}
                  disabled={loading}
                  className={cn(
                    "px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border transition-all cursor-pointer select-none",
                    selected
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="lookbook-notes"
            className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none"
          >
            Notes
          </label>
          <Textarea
            id="lookbook-notes"
            placeholder="What made this look work (or not)?"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            disabled={loading}
            maxLength={500}
            className="resize-none h-20 rounded-none bg-background/40 border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60 placeholder:text-muted-foreground/60 transition-all font-sans text-sm"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-3 animate-fade-in">
            {error}
          </div>
        )}
      </div>
    </EditorialDialog>
  );
}
