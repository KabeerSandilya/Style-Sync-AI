"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { Heart, X, Loader2, Trash2, Sparkles, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Garment } from "./garment-card";

interface GarmentDetailsDialogProps {
  garment: Garment | null;
  open: boolean;
  onClose: () => void;
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

export function GarmentDetailsDialog({
  garment,
  open,
  onClose,
  onSuccess,
}: GarmentDetailsDialogProps) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Uncategorized");
  const [notes, setNotes] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [isFavorite, setIsFavorite] = React.useState(false);

  const [newTagInput, setNewTagInput] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [classifying, setClassifying] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClassify = async () => {
    if (!garment || classifying || saving || deleting) return;

    setClassifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/garments/${garment.id}/classify`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to classify garment.");
      }

      onSuccess("Garment analyzed and updated by AI successfully.");
      onClose();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unable to classify garment.";
      setError(errorMessage);
    } finally {
      setClassifying(false);
    }
  };

  // Sync state when garment changes
  React.useEffect(() => {
    if (garment) {
      setName(garment.name);
      setCategory(garment.category);
      setNotes(garment.notes || "");
      setTags(garment.tags || []);
      setIsFavorite(garment.isFavorite || false);
      setShowDeleteConfirm(false);
      setError(null);
    }
  }, [garment, open]);

  if (!garment) return null;

  const handleAddTag = (tagText: string) => {
    const cleaned = tagText.trim().toLowerCase().replace(/#/g, "");
    if (!cleaned) return;
    if (!tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || deleting) return;

    setSaving(true);
    setError(null);

    const updatedData = {
      name: name.trim() === "" ? "Untitled Garment" : name.trim(),
      category,
      notes: notes.trim() === "" ? null : notes.trim(),
      tags,
      isFavorite,
    };

    try {
      const res = await fetch(`/api/garments/${garment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to update garment.");
      }

      onSuccess("Garment updated successfully.");
      onClose();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unable to update garment.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting || saving) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/garments/${garment.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to delete garment.");
      }

      onSuccess("Garment removed from wardrobe.");
      onClose();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unable to delete garment.";
      setError(errorMessage);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleOpenChange = (openVal: boolean) => {
    if (saving || deleting) return;
    if (!openVal) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!saving && !deleting}
        className={cn(
          "bg-card border border-border/40 rounded-2xl p-6 md:p-8 max-w-[calc(100%-2rem)] sm:max-w-[760px] md:max-w-[850px] max-h-[90vh] overflow-y-auto shadow-xl outline-none ring-0 [&_[data-slot=dialog-close]]:rounded-none [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:text-muted-foreground [&_[data-slot=dialog-close]]:hover:text-foreground",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        )}
      >
        {showDeleteConfirm ? (
          /* Destructive Deletion Confirmation View */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-full gap-5 animate-in fade-in-50 duration-300">
            <div className="bg-destructive/15 text-destructive p-4 rounded-full border border-destructive/20">
              <Trash2 className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-foreground tracking-tight select-none">
              Remove this garment from your wardrobe?
            </h3>
            <p className="font-sans text-sm text-muted-foreground max-w-sm leading-relaxed">
              This action cannot be undone. This piece and all its custom tags and styling notes will be permanently removed.
            </p>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-3 w-full max-w-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 rounded-none py-5 border-border/60 hover:bg-accent/40 text-foreground text-xs font-semibold uppercase tracking-wider"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-none py-5 bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold uppercase tracking-wider"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Main Edit Garment View */
          <div className="flex flex-col gap-1.5">
            <DialogHeader className="gap-1 text-left pb-4 border-b border-border/20">
              <DialogTitle className="font-serif text-2xl font-semibold text-foreground tracking-tight select-none">
                Garment Details
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-4 items-start">
              {/* Left Side: Image Preview & AI Insights */}
              <div className="flex flex-col gap-4">
                <div className="w-full aspect-[4/5] bg-[#fcf9f5] dark:bg-[#151513] border border-border/30 rounded-2xl overflow-hidden flex items-center justify-center p-6 relative select-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={garment.imageUrl}
                    alt={name || "Garment preview"}
                    className="w-full h-full object-contain transition-transform duration-300"
                  />
                </div>

                {/* AI Insights Panel */}
                <div className="bg-background/40 border border-border/50 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/10">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">AI Stylist Insights</span>
                    </div>
                    {garment.isProcessed && garment.confidence && (
                      <span className="text-[9px] text-muted-foreground bg-accent/40 px-1.5 py-0.5 rounded-xs">
                        {garment.confidence}% Match
                      </span>
                    )}
                  </div>

                  {classifying ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-amber-700 dark:text-amber-400 select-none animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI is currently classifying this garment...</span>
                    </div>
                  ) : !garment.isProcessed ? (
                    <div className="flex flex-col gap-1 py-1.5 text-xs text-muted-foreground select-none">
                      <span>No AI insights available yet.</span>
                      <span className="text-[10px] text-muted-foreground/60">Click below to analyze this piece.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Subcategory</span>
                        <span className="font-medium text-foreground">{garment.subcategory || "Unknown"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Style Aesthetic</span>
                        <span className="font-medium text-foreground">{garment.style || "Unknown"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Primary Color</span>
                        <span className="font-medium text-foreground">{garment.primaryColor || "Unknown"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Secondary Color</span>
                        <span className="font-medium text-foreground">{garment.secondaryColor || "Unknown"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Material</span>
                        <span className="font-medium text-foreground">{garment.material || "Unknown"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Season Suitability</span>
                        <span className="font-medium text-foreground">{garment.season || "Unknown"}</span>
                      </div>
                    </div>
                  )}

                  {/* Classify / Re-classify CTA */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClassify}
                    disabled={classifying || saving || deleting}
                    className="w-full text-[10px] py-1.5 h-8 rounded-none mt-1 border-border/80 hover:bg-accent/40 uppercase tracking-wider font-semibold"
                  >
                    {classifying ? (
                      <>
                        <Loader2 className="w-3 animate-spin mr-1.5" />
                        Running Analysis...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 mr-1.5 text-primary" />
                        {garment.isProcessed ? "Re-classify garment" : "Run AI Classification"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right Side: Form metadata inputs */}
              <form onSubmit={handleSave} className="flex flex-col gap-5 h-full justify-between">
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] md:max-h-[380px] pr-2 scrollbar-thin">
                  {/* Name Input */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="edit-garment-name"
                      className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none"
                    >
                      Garment Name
                    </label>
                    <Input
                      id="edit-garment-name"
                      placeholder="Untitled Garment"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 100))}
                      disabled={saving || deleting}
                      className="rounded-none bg-background/40 border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-all font-sans text-sm"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="edit-garment-category"
                      className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none"
                    >
                      Category
                    </label>
                    <select
                      id="edit-garment-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={saving || deleting}
                      className="w-full bg-background/40 text-foreground border border-border/80 px-3 py-2 focus-visible:ring-primary/40 focus:border-primary/60 outline-none text-sm transition-all h-9 select-none cursor-pointer"
                    >
                      {VALID_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Favorite Toggle Option */}
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
                        disabled={saving || deleting}
                      >
                        <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-primary text-primary")} />
                        <span>{isFavorite ? "Featured in Favorites" : "Add to Favorites"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Tag Editing */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
                      Tags
                    </label>
                    {/* Active Tags Chips */}
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
                            className="hover:text-destructive text-accent-foreground/60 transition-colors p-0.5 rounded-none"
                            aria-label={`Remove tag ${tag}`}
                            disabled={saving || deleting}
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

                    {/* Tag input selector */}
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
                        disabled={saving || deleting}
                        className="text-xs py-1 h-8 rounded-none border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60 font-sans"
                      />
                      <Button
                        type="button"
                        onClick={() => handleAddTag(newTagInput)}
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-none border-border/60 hover:bg-accent/40 text-xs px-3"
                        disabled={saving || deleting}
                      >
                        Add
                      </Button>
                    </div>

                    {/* Suggested tags chips list */}
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
                              onClick={() =>
                                isSelected ? handleRemoveTag(tag) : handleAddTag(tag)
                              }
                              className={cn(
                                "px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold border rounded-none transition-all cursor-pointer select-none",
                                isSelected
                                  ? "bg-[#708272] text-[#fffefb] border-[#708272]"
                                  : "border-border/80 text-muted-foreground hover:text-foreground hover:bg-background/80"
                              )}
                              disabled={saving || deleting}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Styling Notes TextArea */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <label
                      htmlFor="edit-garment-notes"
                      className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none"
                    >
                      Styling Notes
                    </label>
                    <Textarea
                      id="edit-garment-notes"
                      placeholder="Add descriptions about cut, fabric, or styling recommendations…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                      disabled={saving || deleting}
                      maxLength={500}
                      className="resize-none h-24 rounded-none bg-background/40 border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60 placeholder:text-muted-foreground/60 transition-all font-sans text-sm"
                    />
                    <div className="flex justify-end select-none">
                      <span className="text-[9px] text-muted-foreground/70">
                        {500 - notes.length} characters remaining
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-2.5 rounded-none flex items-center gap-2 my-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Dialog Form footer Actions */}
                <div className="flex flex-col gap-3 pt-5 border-t border-border/20 mt-4 select-none">
                  <div className="flex gap-3 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saving || deleting}
                      onClick={onClose}
                      className="flex-1 rounded-none py-5 border-border/60 hover:bg-accent/40 text-foreground text-xs font-semibold uppercase tracking-wider"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || deleting}
                      className="flex-1 rounded-none py-5 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full rounded-none hover:bg-destructive/10 text-destructive border border-transparent hover:border-destructive/20 py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                    disabled={saving || deleting}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Piece
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
