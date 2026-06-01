"use client";

import * as React from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  title?: string;
  className?: string;
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
        "sticky top-0 z-40 w-full h-16 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300",
        className
      )}
    >
      {/* Left Section - Sidebar Toggle & Nav Links */}
      <div className="flex items-center gap-6 justify-start flex-1 min-w-0">
        <Button
          variant="outline"
          size="icon"
          onClick={onSidebarToggle}
          className="rounded-none border border-border/60 bg-card/60 hover:bg-accent/40 text-foreground transition-all duration-300 flex items-center justify-center shadow-sm shrink-0"
          aria-label={isSidebarOpen ? "Close wardrobe sidebar" : "Open wardrobe sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-foreground/80" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-foreground/80" />
          )}
        </Button>

        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
          <Link
            href="/editor/wardrobe"
            className={cn(
              "hover:text-foreground transition-colors",
              pathname === "/editor/wardrobe" ? "text-foreground font-bold" : ""
            )}
          >
            Wardrobe
          </Link>
          <Link
            href="/editor/wardrobe?view=outfits"
            className={cn(
              "hover:text-foreground transition-colors",
              pathname === "/editor/wardrobe" ? "text-foreground font-bold" : ""
            )}
          >
            Outfits
          </Link>
          <Link
            href="/history"
            className={cn(
              "hover:text-foreground transition-colors",
              pathname === "/history" ? "text-foreground font-bold" : ""
            )}
          >
            History
          </Link>
          <Link
            href="/insights"
            className={cn(
              "hover:text-foreground transition-colors",
              pathname === "/insights" ? "text-foreground font-bold" : ""
            )}
          >
            Insights
          </Link>
          <Link
            href="/preferences"
            className={cn(
              "hover:text-foreground transition-colors",
              pathname === "/preferences" ? "text-foreground font-bold" : ""
            )}
          >
            Preferences
          </Link>
        </nav>
      </div>

      {/* Center Section - Contextual Information */}
      <div className="flex items-center justify-center text-center shrink-0 mx-4">
        {title ? (
          <Link 
            href="/editor" 
            className="font-serif text-lg md:text-xl font-medium tracking-tight text-foreground transition-all duration-300 hover:text-primary"
          >
            {title}
          </Link>
        ) : (
          <div className="w-16 h-1 bg-border/20 rounded-none" /> /* Visually balanced minimal placeholder */
        )}
      </div>

      {/* Right Section - Clerk User Profile Button */}
      <div className="flex items-center justify-end flex-1">
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 rounded-none border border-border/60 hover:scale-105 transition-transform"
            }
          }}
        />
      </div>
    </header>
  );
}
