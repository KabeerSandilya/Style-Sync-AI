"use client";

import * as React from "react";
import { 
  Sparkles, 
  Upload, 
  Heart, 
  Sun, 
  CloudRain, 
  ArrowRight,
  ChevronRight,
  Info,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { UploadGarmentDialog } from "@/components/editor/upload-garment-dialog";

export default function Home() {
  const [inputText, setInputText] = React.useState("");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  // Wardrobe state management
  const [garments, setGarments] = React.useState<any[]>([]);
  const [fetchingGarments, setFetchingGarments] = React.useState(true);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

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

  React.useEffect(() => {
    fetchGarments();
  }, []);

  const handleAddClothing = () => {
    setIsSidebarOpen(false);
    setIsUploadOpen(true);
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-16 py-12 flex flex-col gap-12">
        {/* Editorial Hero Block */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border/30">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs uppercase tracking-wider font-semibold">Seasonal Influx</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight leading-tight">
              An editorial approach <br />
              to your <span className="italic font-light text-primary">daily silhouette</span>.
            </h1>
          </div>
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="rounded-none px-6 py-6 text-sm font-medium tracking-wide shadow-md group animate-none"
          >
            Upload Garment
            <Upload className="w-4 h-4 ml-2 transition-transform group-hover:-translate-y-0.5" />
          </Button>

          {/* Premium Garment Upload Dialog */}
          <UploadGarmentDialog
            open={isUploadOpen}
            onOpenChange={setIsUploadOpen}
            onSuccess={(msg) => {
              triggerToast(msg || "Garment uploaded successfully.");
              fetchGarments();
            }}
          />
        </section>

        {/* Core Design System Showcase Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card Left: Weather Widget */}
          <Card className="rounded-none border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 text-primary">
                  <Sun className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wider font-sans">Contextual Signal</span>
                </div>
                <span className="text-xs text-muted-foreground font-sans">May 29, 2:45 PM</span>
              </div>
              <CardTitle className="font-serif text-2xl mt-3 font-medium">Paris, France</CardTitle>
              <CardDescription className="font-sans text-xs">Partly Cloudy · 21°C · Humidity 55%</CardDescription>
            </CardHeader>
            <CardContent className="font-sans flex flex-col gap-4 py-2">
              <div className="bg-background/60 rounded-none p-4 border border-border/30 flex items-start gap-3">
                <div className="bg-primary/10 text-primary p-2 rounded-none mt-0.5">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Stylist Suggestion</span>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Light, breathable linen fabrics will suit today&apos;s mild humidity. A soft layer for the evening breeze is recommended.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/20 bg-muted/20 px-6 py-4 flex justify-between items-center">
              <span className="text-xs font-medium font-sans text-primary">View Full Outlook</span>
              <ChevronRight className="w-4 h-4 text-primary/80" />
            </CardFooter>
          </Card>

          {/* Card Center: Tabs & Storefront Feed */}
          <Card className="rounded-none border-border bg-card shadow-sm md:col-span-2">
            <CardHeader className="border-b border-border/30 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="font-serif text-2xl font-medium">Boutique Feed</CardTitle>
                <div className="bg-accent/40 text-primary px-3 py-1 rounded-none text-xs font-medium font-sans flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>24 Favorites</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 font-sans">
              <Tabs defaultValue="wardrobe" className="w-full">
                <TabsList className="bg-muted/40 border border-border/30 p-0 rounded-none mb-6 max-w-xs grid grid-cols-2">
                  <TabsTrigger value="wardrobe" className="rounded-none text-xs font-medium py-2.5 h-full data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    My Wardrobe
                  </TabsTrigger>
                  <TabsTrigger value="outfits" className="rounded-none text-xs font-medium py-2.5 h-full data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    Saved Outfits
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="wardrobe" className="outline-none">
                  <ScrollArea className="h-60 pr-4">
                    {fetchingGarments ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="flex flex-col gap-2">
                            <div className="aspect-[4/5] bg-accent/30 rounded-none w-full" />
                            <div className="h-3.5 bg-accent/30 w-3/4 rounded-none mt-1" />
                            <div className="h-2.5 bg-accent/30 w-1/2 rounded-none mt-1" />
                          </div>
                        ))}
                      </div>
                    ) : garments.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {garments.map((garment) => (
                          <div key={garment.id} className="group/item flex flex-col gap-2 cursor-pointer">
                            <div className="aspect-[4/5] bg-[#fcf9f5] border border-border/30 rounded-none flex items-center justify-center p-4 transition-all duration-300 group-hover/item:scale-[1.02] group-hover/item:shadow-sm relative overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={garment.imageUrl}
                                alt={garment.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-col px-1">
                              <span className="text-sm font-semibold text-foreground leading-snug truncate">
                                {garment.name}
                              </span>
                              <span className="text-xs text-muted-foreground mt-0.5">
                                {garment.category}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          { name: "Beige Linen Blazer", cat: "Outerwear", bg: "bg-[#f5ece3]" },
                          { name: "Olive Sage Trousers", cat: "Bottoms", bg: "bg-[#e3e8e4]" },
                          { name: "Cream Silk Camisole", cat: "Tops", bg: "bg-[#fffefb] border border-border/40" },
                          { name: "Chestnut Leather Boots", cat: "Footwear", bg: "bg-[#eae3db]" },
                          { name: "Trench Coat", cat: "Outerwear", bg: "bg-[#eddccb]" },
                          { name: "Washed Cotton Shirt", cat: "Tops", bg: "bg-[#f3f4f6]" }
                        ].map((item, idx) => (
                          <div key={idx} className="group/item flex flex-col gap-2 cursor-pointer">
                            <div className={`aspect-[4/5] ${item.bg} rounded-none flex items-center justify-center p-4 transition-all duration-300 group-hover/item:scale-[1.02] group-hover/item:shadow-sm`}>
                              <span className="text-xs uppercase tracking-wider font-semibold text-primary/70">{item.cat}</span>
                            </div>
                            <div className="flex flex-col px-1">
                              <span className="text-sm font-semibold text-foreground leading-snug">{item.name}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">{item.cat}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="outfits" className="outline-none">
                  <ScrollArea className="h-60 pr-4">
                    <div className="flex flex-col gap-4">
                      {[
                        { title: "Sage Spring Silhouette", pieces: 3, desc: "Beige Linen Blazer + Olive Sage Trousers + Cream Silk Camisole" },
                        { title: "Autumn Rainy Evening", pieces: 4, desc: "Trench Coat + Chestnut Leather Boots + Olive Sage Trousers" }
                      ].map((outfit, idx) => (
                        <div key={idx} className="border border-border/30 rounded-none p-4 bg-background/30 hover:bg-background/60 transition-colors flex justify-between items-center cursor-pointer group">
                          <div className="flex flex-col gap-1">
                            <span className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors">{outfit.title}</span>
                            <span className="text-xs text-muted-foreground">{outfit.desc}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-semibold">{outfit.pieces} pieces</span>
                            <ArrowRight className="w-4 h-4 text-primary/60 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Input Controls & Test Section */}
        <section className="bg-card border border-border/40 rounded-none p-8 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-primary border-b border-border/30 pb-4">
            <Info className="w-5 h-5" />
            <h2 className="font-serif text-2xl font-medium">Design Tokens Testbed</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            <div className="flex flex-col gap-3">
              <label htmlFor="test-input" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sample Premium Input</label>
              <Input 
                id="test-input" 
                type="text" 
                placeholder="Enter text here..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="rounded-none bg-background/50 border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60"
              />
              <span className="text-[11px] text-muted-foreground italic">Try focusing the input. The focus ring is a soft, elegant sage outline instead of standard SaaS blue.</span>
            </div>
            
            <div className="flex flex-col gap-3 justify-center bg-background/40 border border-border/30 p-5 rounded-none">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dynamic Preview</span>
              <p className="text-base text-foreground font-serif italic">
                &ldquo;{inputText || "Your style is defined by your expression."}&rdquo;
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-6 bg-card/10 text-center font-sans text-xs text-muted-foreground">
        <p>© 2026 StyleSync AI. Crafted with an editorial fashion perspective.</p>
      </footer>
      {/* Premium Minimal Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground border border-border/20 px-6 py-4 shadow-xl select-none animate-slide-in font-sans font-medium text-xs flex items-center gap-2 transition-all">
          <Sparkles className="w-4 h-4 text-primary-foreground/90" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-4 hover:opacity-80 transition-opacity p-0.5"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
