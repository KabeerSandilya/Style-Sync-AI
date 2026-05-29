"use client";

import * as React from "react";
import { X, Plus, Shirt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClothing?: () => void;
}

export function ProjectSidebar({ isOpen, onClose, onAddClothing }: ProjectSidebarProps) {
  // Close sidebar on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/10 backdrop-blur-xs z-50 transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-[320px] sm:w-[380px] bg-card border-r border-border/40 shadow-2xl z-50 transition-transform duration-300 ease-in-out transform flex flex-col h-full",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/20">
          <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground select-none">
            Wardrobe
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/80 size-8 transition-colors flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation Tabs and Content */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          <Tabs defaultValue="wardrobe" className="flex flex-col h-full w-full">
            <TabsList className="bg-muted/40 border border-border/20 p-0 rounded-none mb-6 w-full grid grid-cols-2">
              <TabsTrigger
                value="wardrobe"
                className="rounded-none text-xs font-medium py-3 h-full transition-all data-active:bg-card data-active:text-foreground data-active:shadow-sm"
              >
                My Wardrobe
              </TabsTrigger>
              <TabsTrigger
                value="outfits"
                className="rounded-none text-xs font-medium py-3 h-full transition-all data-active:bg-card data-active:text-foreground data-active:shadow-sm"
              >
                Saved Outfits
              </TabsTrigger>
            </TabsList>

            {/* Scrollable Tab Contents */}
            <div className="flex-1 overflow-hidden">
              <TabsContent value="wardrobe" className="h-full flex flex-col outline-none">
                <ScrollArea className="h-full pr-1">
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="bg-accent/40 text-primary p-4 rounded-none mb-4">
                      <Shirt className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-foreground tracking-tight">
                      Your wardrobe is empty
                    </h3>
                    <p className="font-sans text-xs text-muted-foreground max-w-[240px] mx-auto mt-2 leading-relaxed">
                      Upload your clothes to curate combinations and construct your signature style.
                    </p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="outfits" className="h-full flex flex-col outline-none">
                <ScrollArea className="h-full pr-1">
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="bg-accent/40 text-primary p-4 rounded-none mb-4">
                      <Sparkles className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-foreground tracking-tight">
                      No saved combinations
                    </h3>
                    <p className="font-sans text-xs text-muted-foreground max-w-[240px] mx-auto mt-2 leading-relaxed">
                      Your saved outfits will appear here. Start experimenting in the builder to save your first look.
                    </p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Bottom Anchored CTA */}
        <div className="p-6 border-t border-border/20 bg-card/60 backdrop-blur-xs">
          <Button
            onClick={onAddClothing}
            className="w-full py-6 rounded-none bg-primary text-primary-foreground font-medium tracking-wide flex items-center justify-center gap-2 group shadow-sm hover:shadow transition-all duration-300"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            Add Clothing
          </Button>
        </div>
      </aside>
    </>
  );
}
