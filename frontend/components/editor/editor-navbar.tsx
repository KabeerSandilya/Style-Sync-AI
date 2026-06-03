"use client";

import * as React from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  title?: string;
  className?: string;
}

function NavItems({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const isOutfitsView = pathname === "/editor/wardrobe" && searchParams.get("view") === "outfits";
  const isWardrobeView = pathname === "/editor/wardrobe" && !isOutfitsView;

  const navItems = [
    { label: "Wardrobe", href: "/editor/wardrobe", active: isWardrobeView },
    { label: "Outfits", href: "/editor/wardrobe?view=outfits", active: isOutfitsView },
    { label: "History", href: "/history", active: pathname === "/history" },
    { label: "Insights", href: "/insights", active: pathname === "/insights" },
    { label: "Preferences", href: "/preferences", active: pathname === "/preferences" },
  ];

  return (
    <>
      {navItems.map(({ label, href, active }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "relative font-sans text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 py-0.5",
            active
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
          {active && (
            <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-primary" />
          )}
        </Link>
      ))}
    </>
  );
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
  title,
  className,
}: EditorNavbarProps) {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full h-14 border-b border-border/40 bg-background/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 transition-all duration-300",
        className
      )}
    >
      {/* Left — Sidebar toggle + nav */}
      <div className="flex items-center gap-5 justify-start flex-1 min-w-0">
        <Button
          variant="outline"
          size="icon"
          onClick={onSidebarToggle}
          className="rounded-none border border-border/50 bg-transparent hover:bg-accent/40 text-foreground/70 hover:text-foreground transition-all duration-200 flex items-center justify-center shrink-0 h-8 w-8"
          aria-label={isSidebarOpen ? "Close wardrobe sidebar" : "Open wardrobe sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          )}
        </Button>

        <nav className="hidden md:flex items-center gap-5 select-none" aria-label="Editor navigation">
          <React.Suspense fallback={null}>
            <NavItems pathname={pathname} />
          </React.Suspense>
        </nav>
      </div>

      {/* Centre — wordmark */}
      <div className="flex items-center justify-center shrink-0 mx-4">
        {title ? (
          <Link
            href="/editor"
            className="font-serif text-sm md:text-base font-light tracking-[0.24em] uppercase text-foreground/80 hover:text-primary transition-colors duration-200 select-none"
          >
            {title}
          </Link>
        ) : (
          <div className="w-12 h-px bg-border/30" />
        )}
      </div>

      {/* Right — User */}
      <div className="flex items-center justify-end flex-1">
        <UserButton
          appearance={{
            variables: {
              colorBackground: "#fffefb",
              colorNeutral: "#1c1917",
              colorForeground: "#1c1917",
              colorMutedForeground: "#78716c",
              colorPrimary: "#708272",
              colorPrimaryForeground: "#fffefb",
              colorBorder: "#ebdcd0",
              colorInput: "#faf6f0",
              colorInputForeground: "#1c1917",
              borderRadius: "0px",
            },
            elements: {
              avatarBox: "w-7 h-7 rounded-none border border-border/50 hover:scale-105 transition-transform",
              userButtonPopoverCard: {
                background: "#fffefb",
                border: "1px solid #ebdcd0",
                borderRadius: "0px",
                boxShadow: "0 4px 24px rgba(28,25,23,0.12)",
              },
              userButtonPopoverActions: { background: "#fffefb" },
              userButtonPopoverActionButton: {
                background: "#fffefb",
                color: "#1c1917",
                borderRadius: "0px",
              },
              userButtonPopoverActionButtonText: { color: "#1c1917" },
              userButtonPopoverActionButtonIcon: { color: "#708272" },
              userButtonPopoverFooter: {
                background: "#f5ece3",
                borderTop: "1px solid #ebdcd0",
              },
            },
          }}
        />
      </div>
    </header>
  );
}
