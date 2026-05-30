"use client";

import * as React from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

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
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full h-16 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300",
        className
      )}
    >
      {/* Left Section - Sidebar Toggle */}
      <div className="flex items-center w-1/3 justify-start">
        <Button
          variant="outline"
          size="icon"
          onClick={onSidebarToggle}
          className="rounded-none border border-border/60 bg-card/60 hover:bg-accent/40 text-foreground transition-all duration-300 flex items-center justify-center shadow-sm"
          aria-label={isSidebarOpen ? "Close wardrobe sidebar" : "Open wardrobe sidebar"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-foreground/80" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-foreground/80" />
          )}
        </Button>
      </div>

      {/* Center Section - Contextual Information */}
      <div className="flex items-center w-1/3 justify-center text-center">
        {title ? (
          <span className="font-serif text-lg md:text-xl font-medium tracking-tight text-foreground transition-all duration-300">
            {title}
          </span>
        ) : (
          <div className="w-16 h-1 bg-border/20 rounded-none" /> /* Visually balanced minimal placeholder */
        )}
      </div>

      {/* Right Section - Reserved for future action placeholders */}
      <div className="flex items-center w-1/3 justify-end">
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
