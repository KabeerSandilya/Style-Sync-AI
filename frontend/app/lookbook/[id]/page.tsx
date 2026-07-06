"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Star, Trash2, ExternalLink, Loader2, Share2 } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { Button } from "@/components/ui/button";
import { useLookBookEntry, useDeleteLookBookEntry } from "@/lib/hooks/use-lookbook";
import { useCommunityPostBySource } from "@/lib/hooks/use-community";
import { PublishToCommunityDialog } from "@/components/community/publish-to-community-dialog";
import { cn } from "@/lib/utils";

export default function LookBookEntryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: entry, isLoading } = useLookBookEntry(params.id);
  const deleteEntry = useDeleteLookBookEntry();
  const { data: existingPost } = useCommunityPostBySource(entry?.isShareable ? entry.id : null);
  const [publishOpen, setPublishOpen] = React.useState(false);

  const handleDelete = async () => {
    if (!entry || deleteEntry.isPending) return;
    if (!confirm("Remove this Look Book entry? This cannot be undone.")) return;
    const result = await deleteEntry.mutateAsync(entry.id);
    if (result.success) {
      router.push("/lookbook");
    } else {
      alert(result.error || "Failed to delete entry.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      <EditorNavbar isSidebarOpen={false} onSidebarToggle={() => {}} title="Look Book" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-8 py-12 flex flex-col gap-8">
        <button
          onClick={() => router.push("/lookbook")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest font-sans transition-colors cursor-pointer w-fit"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Look Book
        </button>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-4/5 bg-accent/20 w-full" />
            <div className="flex flex-col gap-4">
              <div className="h-8 bg-accent/20 w-2/3" />
              <div className="h-4 bg-accent/20 w-1/2" />
            </div>
          </div>
        ) : !entry ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border/60 p-16 text-center bg-card/25 min-h-80">
            <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight">
              Entry not found.
            </h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
            <div className="w-full aspect-4/5 bg-[#fcf9f5] dark:bg-[#151513] border border-border/30 overflow-hidden">
              <img src={entry.photoUrl} alt={entry.outfit?.name ?? "Look Book entry"} className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <h1 className="font-serif text-3xl font-medium tracking-tight leading-tight">
                  {entry.outfit?.name ?? "Unlinked look"}
                </h1>
              </div>

              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5",
                      i < entry.rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                    )}
                  />
                ))}
              </div>

              {entry.mood.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.mood.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-muted/40 text-muted-foreground border border-border/50 text-[10px] uppercase tracking-widest font-medium font-sans"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {entry.notes && (
                <p className="font-sans text-sm italic text-muted-foreground bg-muted/20 p-4 border border-border/20 leading-relaxed">
                  {entry.notes}
                </p>
              )}

              {entry.outfit ? (
                <button
                  onClick={() => router.push(`/editor/wardrobe?selectedOutfitId=${entry.outfit!.id}&view=outfits`)}
                  className="flex items-center gap-1.5 text-primary hover:underline text-xs font-semibold uppercase tracking-wider w-fit cursor-pointer"
                >
                  View linked outfit
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">Not linked to an outfit.</p>
              )}

              <div className="pt-5 border-t border-border/20 mt-2 flex flex-wrap gap-3">
                {entry.isShareable && (
                  <Button
                    variant="outline"
                    onClick={() => setPublishOpen(true)}
                    className="rounded-none border-primary/40 hover:border-primary hover:bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider py-5 px-5 gap-2 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {existingPost ? "Update Community Post" : "Publish to Community"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteEntry.isPending}
                  className="rounded-none border-destructive/30 hover:border-destructive hover:bg-destructive/5 text-destructive/80 hover:text-destructive text-[10px] font-bold uppercase tracking-wider py-5 px-5 gap-2 cursor-pointer"
                >
                  {deleteEntry.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Remove Entry
                </Button>
              </div>
            </div>
          </div>
        )}

        {entry && entry.isShareable && (
          <PublishToCommunityDialog
            open={publishOpen}
            onOpenChange={setPublishOpen}
            entry={entry}
            existingCaption={existingPost?.caption}
            existingOccasion={existingPost?.occasion}
          />
        )}
      </main>
    </div>
  );
}
