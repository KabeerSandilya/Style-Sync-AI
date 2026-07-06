"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, TrendingUp, Settings2 } from "lucide-react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { EditorialDialog } from "@/components/editor/editorial-dialog";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { CommunityProfileSetup } from "@/components/community/community-profile-setup";
import {
  useCommunityFeed,
  useCommunityProfile,
  useLikePost,
  useSavePost,
  useDeleteCommunityPost,
  type CommunityFeedFilters,
} from "@/lib/hooks/use-community";
import { useGarments } from "@/lib/hooks/use-garments";
import { useOutfits } from "@/lib/hooks/use-outfits";
import { OCCASIONS } from "@style-sync/backend/types";
import type { Garment, Outfit, CommunityPost } from "@/types";
import { cn } from "@/lib/utils";

function OccasionPillRow({
  selected,
  onSelect,
}: {
  selected: string | undefined;
  onSelect: (value: string | undefined) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
      {OCCASIONS.map((opt) => {
        const isSelected = selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelect(isSelected ? undefined : opt)}
            className={cn(
              "shrink-0 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest transition-colors cursor-pointer",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:border-primary"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"feed" | "saved">("feed");
  const [trending, setTrending] = React.useState(false);
  const [occasion, setOccasion] = React.useState<string | undefined>(undefined);
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);

  const filters: CommunityFeedFilters = {
    tab: activeTab,
    sort: activeTab === "feed" && trending ? "trending" : "newest",
    occasion,
  };

  const { data: posts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCommunityFeed(filters);
  const { data: profile } = useCommunityProfile();
  const likePost = useLikePost();
  const savePost = useSavePost();
  const deletePost = useDeleteCommunityPost();

  const { data: garments = [], isLoading: fetchingGarments } = useGarments();
  const { data: outfits = [], isLoading: fetchingOutfits } = useOutfits();

  const sentinelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (filters.sort === "trending") return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filters.sort, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleGarmentClick = (g: Garment) => {
    setIsSidebarOpen(false);
    router.push(`/editor/wardrobe?selectedGarmentId=${g.id}`);
  };

  const handleOutfitClick = (o: Outfit) => {
    setIsSidebarOpen(false);
    router.push(`/editor/wardrobe?selectedOutfitId=${o.id}&view=outfits`);
  };

  const handleAddClothing = () => {
    setIsSidebarOpen(false);
    router.push(`/editor/wardrobe?addClothing=true`);
  };

  const handleLike = (post: CommunityPost) => likePost.mutate(post.id);
  const handleSave = (post: CommunityPost) => savePost.mutate(post.id);
  const handleDelete = (post: CommunityPost) => {
    if (!confirm("Remove this post from Community? This cannot be undone.")) return;
    deletePost.mutate(post.id);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="Community"
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onAddClothing={handleAddClothing}
        garments={garments}
        loading={fetchingGarments}
        onGarmentClick={handleGarmentClick}
        outfits={outfits}
        loadingOutfits={fetchingOutfits}
        onOutfitClick={handleOutfitClick}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-8 py-12 flex flex-col gap-10">
        <section className="flex flex-col gap-3 pb-8 border-b border-border/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/40 flex items-center justify-center text-primary shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                Community <span className="italic font-light text-primary">style</span>.
              </h1>
            </div>
            {profile && (
              <button
                onClick={() => setEditProfileOpen(true)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-widest font-sans transition-colors cursor-pointer shrink-0"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Edit Community Profile
              </button>
            )}
          </div>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-[52ch]">
            Looks shared from the community. Browse, like, and save what inspires you.
          </p>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {(
                [
                  { key: "feed", label: "Feed" },
                  { key: "saved", label: "Saved" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest font-sans transition-colors cursor-pointer border-b-2",
                    activeTab === tab.key
                      ? "text-primary border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "feed" && (
              <button
                onClick={() => setTrending((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest font-sans transition-colors cursor-pointer border",
                  trending
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary"
                )}
              >
                <TrendingUp className="w-3 h-3" />
                Trending
              </button>
            )}
          </div>

          <OccasionPillRow selected={occasion} onSelect={setOccasion} />
        </section>

        <section className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex flex-col border border-border/20 bg-card/60 animate-pulse">
                  <div className="aspect-4/5 bg-accent/20 w-full" />
                  <div className="flex flex-col p-5 gap-3">
                    <div className="h-4 bg-accent/20 w-2/3" />
                    <div className="h-3 bg-accent/20 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border/60 p-16 text-center bg-card/25 select-none min-h-100">
              <div className="bg-accent/40 text-primary p-4 mb-6">
                <Users className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground tracking-tight">
                {activeTab === "feed" ? "No one has shared a look yet." : "Save looks you love to find them here."}
              </h2>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in">
                {posts.map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    isDeleting={deletePost.isPending && deletePost.variables === post.id}
                  />
                ))}
              </div>
              {filters.sort !== "trending" && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                  {isFetchingNextPage && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <EditorialDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        title="Edit Community Profile"
        description="Update how you appear across the Community feed."
      >
        <CommunityProfileSetup existingProfile={profile} onSuccess={() => setEditProfileOpen(false)} />
      </EditorialDialog>

      <footer className="border-t border-border/30 py-10 px-6 bg-card/10 text-center font-sans text-[11px] text-muted-foreground/60 tracking-wide">
        © 2026 StyleSync AI.
      </footer>
    </div>
  );
}
