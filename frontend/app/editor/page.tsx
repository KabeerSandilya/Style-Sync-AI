"use client";

import * as React from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { TodaysRecommendations } from "@/components/recommendation/todays-recommendations";
import { Garment, Outfit } from "@/types";

export default function Home() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Wardrobe and Outfit list state for Sidebar drawer rendering
  const [garments, setGarments] = React.useState<Garment[]>([]);
  const [fetchingGarments, setFetchingGarments] = React.useState(true);
  const [outfits, setOutfits] = React.useState<Outfit[]>([]);
  const [fetchingOutfits, setFetchingOutfits] = React.useState(true);

  const fetchGarments = async () => {
    try {
      const res = await fetch("/api/garments");
      const data = await res.json();
      if (data.success) {
        setGarments(data.data);
      }
    } catch (error) {
      console.error("Error fetching garments:", error);
    } finally {
      setFetchingGarments(false);
    }
  };

  const fetchOutfits = async () => {
    try {
      const res = await fetch("/api/outfits");
      const data = await res.json();
      if (data.success) {
        setOutfits(data.data);
      }
    } catch (error) {
      console.error("Error fetching outfits:", error);
    } finally {
      setFetchingOutfits(false);
    }
  };

  React.useEffect(() => {
    fetchGarments();
    fetchOutfits();
  }, []);

  // Sidebar deep-linking click actions (redirection to Wardrobe Studio page)
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent/50">
      {/* Editor Navbar Chrome */}
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        title="StyleSync AI"
      />

      {/* Wardrobe Drawer Sidebar Overlay */}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 md:px-8 py-12 flex flex-col gap-10">
        
        {/* Editorial Centered Hero Block */}
        <section className="flex flex-col items-center text-center gap-2 pb-6 border-b border-border/30">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider font-semibold">Seasonal Influx</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight mt-1">
            An editorial approach <br />
            to your <span className="italic font-light text-primary">daily silhouette</span>.
          </h1>
          <p className="text-xs text-muted-foreground max-w-md font-sans mt-2 leading-relaxed">
            StyleSync AI evaluates your wardrobe collection against current weather conditions to formulate recommendations.
          </p>
        </section>

        {/* Dynamic weather & outfit recommendations */}
        <section className="w-full">
          <TodaysRecommendations
            onCreateOutfitClick={() => router.push("/editor/wardrobe?view=outfits")}
            onOutfitClick={(o) => router.push(`/editor/wardrobe?selectedOutfitId=${o.id}&view=outfits`)}
          />
        </section>

        {/* Premium redirect CTA to enter wardrobe studio */}
        <section className="flex justify-center mt-2 border-t border-border/20 pt-8">
          <Button
            onClick={() => router.push("/editor/wardrobe")}
            className="rounded-none px-8 py-6 text-xs font-semibold tracking-widest uppercase shadow-md group transition-all"
          >
            Enter Wardrobe Studio
            <ChevronRight className="w-4.5 h-4.5 ml-2 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-6 bg-card/10 text-center font-sans text-xs text-muted-foreground mt-auto">
        <p>© 2026 StyleSync AI. Crafted with an editorial fashion perspective.</p>
      </footer>
    </div>
  );
}
