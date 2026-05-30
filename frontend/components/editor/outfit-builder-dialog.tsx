"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import * as React from "react";
import { Heart, Sparkles, Trash2, X, AlertTriangle, Menu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Garment, Outfit } from "@/types";

interface OutfitBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  garments: Garment[];
  outfit?: Outfit | null; // If provided, we are in edit mode
  onSuccess?: (message: string) => void;
}

export function OutfitBuilderDialog({
  open,
  onOpenChange,
  garments = [],
  outfit,
  onSuccess,
}: OutfitBuilderDialogProps) {
  const isEditMode = !!outfit;

  // Dialog Form States
  const [selectedGarmentIds, setSelectedGarmentIds] = React.useState<string[]>([]);
  const [name, setName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isFavorite, setIsFavorite] = React.useState(false);

  // Status States
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Left Section Categories Filter
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const mainCategories = [
    "All",
    "Tops",
    "Bottoms",
    "Outerwear",
    "Footwear",
    "Accessories",
  ];

  const extraCategories = [
    "Formalwear",
    "Sportswear",
    "Ethnicwear",
    "Uncategorized",
  ];

  // Initialize/Reset states on open/change
  React.useEffect(() => {
    if (open) {
      setErrorMessage(null);
      setShowDeleteConfirm(false);
      if (outfit) {
        setSelectedGarmentIds(outfit.garments.map((g) => g.garment.id));
        setName(outfit.name || "");
        setNotes(outfit.notes || "");
        setIsFavorite(outfit.isFavorite || false);
      } else {
        setSelectedGarmentIds([]);
        setName("");
        setNotes("");
        setIsFavorite(false);
      }
    }
  }, [open, outfit]);

  // Toggle garment selection
  const handleGarmentToggle = (garmentId: string) => {
    if (saving || deleting) return;
    setErrorMessage(null);
    setSelectedGarmentIds((prev) =>
      prev.includes(garmentId)
        ? prev.filter((id) => id !== garmentId)
        : [...prev, garmentId]
    );
  };

  // Filter garments based on category
  const filteredGarments = React.useMemo(() => {
    return garments.filter((g) => {
      let matchesCategory = false;
      if (selectedCategory === "All") {
        matchesCategory = true;
      } else if (selectedCategory.toLowerCase() === "tops") {
        matchesCategory =
          g.category.toLowerCase() === "topwear" ||
          g.category.toLowerCase() === "tops";
      } else if (selectedCategory.toLowerCase() === "bottoms") {
        matchesCategory =
          g.category.toLowerCase() === "bottomwear" ||
          g.category.toLowerCase() === "bottoms";
      } else {
        matchesCategory =
          g.category.toLowerCase() === selectedCategory.toLowerCase();
      }
      return matchesCategory;
    });
  }, [garments, selectedCategory]);

  // Handle save (Create or Update)
  const handleSave = async () => {
    if (selectedGarmentIds.length === 0) {
      setErrorMessage("Please select at least one garment.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const payload = {
      name: name.trim(),
      notes: notes.trim(),
      isFavorite,
      garmentIds: selectedGarmentIds,
    };

    try {
      const url = isEditMode ? `/api/outfits/${outfit.id}` : "/api/outfits";
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess?.(isEditMode ? "Outfit updated successfully." : "Outfit created successfully.");
        onOpenChange(false);
      } else {
        setErrorMessage(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error saving outfit:", error);
      setErrorMessage("Failed to save outfit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!outfit) return;

    setDeleting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/outfits/${outfit.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        onSuccess?.("Outfit removed from wardrobe.");
        onOpenChange(false);
      } else {
        setErrorMessage(data.error || "Failed to delete outfit.");
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Error deleting outfit:", error);
      setErrorMessage("Failed to delete outfit. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // Get current selected garments objects
  const selectedGarments = React.useMemo(() => {
    return selectedGarmentIds
      .map((id) => garments.find((g) => g.id === id))
      .filter((g): g is Garment => !!g);
  }, [selectedGarmentIds, garments]);

  return (
    <Dialog open={open} onOpenChange={(val) => !saving && !deleting && onOpenChange(val)}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[760px] md:max-w-[850px] lg:max-w-4xl p-0 overflow-hidden bg-card border border-border/40 rounded-none shadow-2xl h-[90vh] md:h-[80vh] max-h-[850px] flex flex-col focus:outline-none ring-0 [&_[data-slot=dialog-close]]:rounded-none [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:text-muted-foreground [&_[data-slot=dialog-close]]:hover:text-foreground">
        
        {/* Main Columns Container */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* LEFT SECTION: Wardrobe Selection Panel */}
          <div className="flex-1 flex flex-col p-6 md:p-8 min-h-0 border-b md:border-b-0 md:border-r border-border/30 overflow-hidden">
            <DialogHeader className="mb-6">
              <DialogTitle className="font-serif text-2xl md:text-3xl font-medium tracking-tight text-foreground select-none">
                {isEditMode ? "Edit Outfit Combination" : "Curate New Outfit"}
              </DialogTitle>
              <p className="font-sans text-xs text-muted-foreground mt-1">
                Select pieces from your wardrobe to assemble your look.
              </p>
            </DialogHeader>

            {/* Category selection */}
            <div className="relative flex flex-row items-center gap-x-5 pb-3 mb-6 border-b border-border/20 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" ref={dropdownRef}>
              {mainCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    "pb-1 transition-all hover:text-foreground cursor-pointer relative",
                    selectedCategory === cat ? "text-foreground font-bold" : ""
                  )}
                >
                  {cat}
                  {selectedCategory === cat && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}

              {/* Hamburger menu for extra categories */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={cn(
                    "pb-1 flex items-center gap-1 transition-all hover:text-foreground cursor-pointer relative",
                    extraCategories.includes(selectedCategory) ? "text-foreground font-bold" : ""
                  )}
                  aria-label="More categories"
                  aria-expanded={isDropdownOpen}
                >
                  <Menu className="w-3.5 h-3.5" />
                  {extraCategories.includes(selectedCategory) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border/40 shadow-xl z-50 py-1 focus:outline-none rounded-none animate-in fade-in slide-in-from-top-1 duration-200">
                    {extraCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors hover:bg-muted/80 hover:text-foreground cursor-pointer flex items-center justify-between",
                          selectedCategory === cat ? "text-foreground font-bold bg-muted/40" : "text-muted-foreground"
                        )}
                      >
                        <span>{cat}</span>
                        {selectedCategory === cat && (
                          <span className="w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Wardrobe Grid */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full pr-3">
                {filteredGarments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center select-none">
                    <span className="text-xs text-muted-foreground italic">No garments found in this category.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-0.5">
                    {filteredGarments.map((garment) => {
                      const isSelected = selectedGarmentIds.includes(garment.id);
                      return (
                        <div
                          key={garment.id}
                          onClick={() => handleGarmentToggle(garment.id)}
                          className={cn(
                            "group cursor-pointer border p-3 flex flex-col gap-2 transition-all duration-200 select-none bg-background/35 rounded-none",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "border-border/40 hover:border-border/80 hover:bg-background/80"
                          )}
                        >
                          <div className="aspect-[4/5] bg-card border border-border/20 rounded-none flex items-center justify-center p-2 overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={garment.imageUrl}
                              alt={garment.name}
                              className="max-h-full max-w-full object-contain filter drop-shadow-xs transition-transform duration-300 group-hover:scale-102"
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] font-bold font-sans uppercase px-1.5 py-0.5 shadow-sm">
                                Selected
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground leading-tight truncate">
                              {garment.name}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-primary/80 mt-0.5">
                              {garment.category}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* RIGHT SECTION: Outfit Preview and Form */}
          <div className="w-full md:w-[380px] bg-card/60 backdrop-blur-xs flex flex-col p-6 md:p-8 min-h-0 overflow-hidden shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-3.5 font-sans">
              Outfit Preview
            </span>

            {/* Visual stacked flat-lay preview */}
            <div className="h-48 border border-dashed border-border/60 bg-background/30 rounded-none flex items-center justify-center p-4 relative overflow-hidden mb-6">
              {selectedGarments.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground/60 text-center gap-1.5 px-6">
                  <Sparkles className="w-5 h-5 stroke-[1.5]" />
                  <span className="text-[11px] font-sans">No pieces selected. Click items on the left to start curating.</span>
                </div>
              ) : (
                <div className="w-full h-full relative flex items-center justify-center">
                  {selectedGarments.map((g, idx) => {
                    // Overlap stacking calculation:
                    // Max 3 shown in stack overlap
                    const maxStack = 3;
                    const reversedIdx = selectedGarments.length - 1 - idx;
                    if (reversedIdx >= maxStack) return null;

                    const scale = 1 - reversedIdx * 0.08;
                    const rotate = (reversedIdx - 1) * 8; // Rotates between -8, 0, 8 depending on stack position
                    const translateY = -reversedIdx * 10;
                    const opacity = 1 - reversedIdx * 0.15;
                    const zIndex = 10 - reversedIdx;

                    return (
                      <div
                        key={g.id}
                        className="absolute w-[40%] h-[75%] flex items-center justify-center transition-all duration-300 pointer-events-none"
                        style={{
                          transform: `translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                          opacity,
                          zIndex,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.imageUrl}
                          alt={g.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-lg"
                        />
                      </div>
                    );
                  })}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-card border border-border/30 text-[9px] font-sans uppercase font-bold tracking-wider text-muted-foreground z-20">
                    {selectedGarments.length} {selectedGarments.length === 1 ? "Item" : "Items"}
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields container */}
            <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden mb-6">
              <ScrollArea className="h-full pr-2">
                <div className="flex flex-col gap-5 py-1">
                  
                  {/* Outfit Name */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="outfit-name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Outfit Name
                    </label>
                    <Input
                      id="outfit-name"
                      type="text"
                      placeholder="e.g., Casual Sunday Linen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={saving || deleting}
                      className="rounded-none bg-background/50 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary/60 text-sm font-sans h-10 px-3"
                    />
                  </div>

                  {/* Outfit Notes */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="outfit-notes" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Styling Notes
                      </label>
                      <span className="text-[9px] text-muted-foreground font-semibold">
                        {notes.length}/500
                      </span>
                    </div>
                    <Textarea
                      id="outfit-notes"
                      placeholder="Add custom wearing tips, season compatibility, or style tags..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                      disabled={saving || deleting}
                      rows={4}
                      className="rounded-none bg-background/50 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary/60 text-xs leading-relaxed resize-none min-h-24 p-3"
                    />
                  </div>

                  {/* Favorite Toggle button */}
                  <button
                    onClick={() => !saving && !deleting && setIsFavorite(!isFavorite)}
                    className={cn(
                      "flex items-center justify-center gap-2 border px-4 h-11 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer rounded-none w-full",
                      isFavorite
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    )}
                    type="button"
                  >
                    <Heart className={cn("w-4 h-4", isFavorite ? "fill-primary text-primary" : "")} />
                    <span>{isFavorite ? "Favorited Outfit" : "Mark as Favorite"}</span>
                  </button>

                  {/* Selected Garments Chips List */}
                  {selectedGarments.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Included Pieces
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGarments.map((g) => (
                          <div
                            key={g.id}
                            className="flex items-center gap-1.5 border border-border/40 px-2 py-1 bg-background/40 text-[10px] text-foreground font-sans rounded-none group/chip"
                          >
                            <span className="truncate max-w-[120px]">{g.name}</span>
                            <button
                              onClick={() => handleGarmentToggle(g.id)}
                              disabled={saving || deleting}
                              className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                              aria-label={`Remove ${g.name}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-none flex items-start gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-sans">{errorMessage}</span>
                    </div>
                  )}

                </div>
              </ScrollArea>
            </div>

            {/* ACTION FOOTER */}
            <div className="border-t border-border/20 pt-5 bg-card/10">
              {showDeleteConfirm ? (
                <div className="flex flex-col gap-3.5">
                  <span className="text-xs text-destructive font-semibold font-sans text-center">
                    Remove this outfit from your wardrobe?
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="rounded-none text-xs tracking-wider h-11"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-none text-xs tracking-wider h-11"
                    >
                      {deleting ? "Removing..." : "Yes, Remove"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <div className="flex justify-between gap-3">
                    {isEditMode && (
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={saving}
                        className="rounded-none border-destructive/40 hover:border-destructive text-destructive hover:bg-destructive/10 w-11 h-11 flex items-center justify-center transition-all shrink-0"
                        title="Delete Outfit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className={cn(
                        "flex-1 rounded-none text-xs tracking-wider h-11",
                        isEditMode ? "" : "w-full"
                      )}
                    >
                      {saving ? "Saving..." : isEditMode ? "Save Changes" : "Create Outfit"}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={saving}
                    className="w-full rounded-none text-xs tracking-wider text-muted-foreground hover:text-foreground h-11"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
