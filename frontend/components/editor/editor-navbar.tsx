"use client";

import * as React from "react";
import {
  PanelLeftOpen,
  PanelLeftClose,
  SlidersHorizontal,
  ChevronDown,
  BarChart3,
  Fingerprint,
  BookOpen,
  Users,
} from "lucide-react";
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

function NavLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative whitespace-nowrap font-sans text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-200 py-0.5",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {active && (
        <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-primary" />
      )}
    </Link>
  );
}

const DISCOVER_ITEMS = [
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "Style DNA", href: "/style-dna", icon: Fingerprint },
  { label: "Look Book", href: "/lookbook", icon: BookOpen },
  { label: "Community", href: "/community", icon: Users },
];

function isDiscoverActive(pathname: string, href: string) {
  if (href === "/lookbook" || href === "/community") return pathname.startsWith(href);
  return pathname === href;
}

function DiscoverMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const active = DISCOVER_ITEMS.some((item) => isDiscoverActive(pathname, item.href));

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-none border font-sans text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 h-8 px-3",
          active || open
            ? "border-primary/50 text-foreground bg-accent/40"
            : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent/30"
        )}
      >
        Discover
        <span className={cn("h-1 w-1 rounded-full bg-primary transition-opacity", active ? "opacity-100" : "opacity-0")} aria-hidden="true" />
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-52 border border-border/50 bg-background shadow-[0_4px_24px_rgba(28,25,23,0.12)] py-1 z-50"
        >
          {DISCOVER_ITEMS.map((item) => {
            const Icon = item.icon;
            const itemActive = isDiscoverActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-150",
                  itemActive ? "text-foreground bg-accent/40" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Needs useSearchParams (to detect the ?view=outfits query) so it's kept
// separate from the right-side nav and wrapped in Suspense at the call site.
function PrimaryNavLeft({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const isOutfitsView = pathname === "/editor/wardrobe" && searchParams.get("view") === "outfits";
  const isWardrobeView = pathname === "/editor/wardrobe" && !isOutfitsView;

  const items = [
    { label: "Wardrobe", href: "/editor/wardrobe", active: isWardrobeView },
    { label: "Outfits", href: "/editor/wardrobe?view=outfits", active: isOutfitsView },
  ];

  return (
    <>
      {items.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </>
  );
}

function PrimaryNavRight({ pathname }: { pathname: string }) {
  const items = [
    { label: "Planner", href: "/editor/planner", active: pathname === "/editor/planner" },
    { label: "History", href: "/history", active: pathname === "/history" },
  ];

  return (
    <>
      {items.map((item) => (
        <NavLink key={item.href} {...item} />
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
      <div className="flex items-center gap-5 justify-start flex-1">
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
            <PrimaryNavLeft pathname={pathname} />
          </React.Suspense>
        </nav>
      </div>

      {/* Centre — wordmark */}
      <div className="flex items-center justify-center shrink-0 mx-4">
        {title ? (
          <Link
            href="/editor"
            className="font-serif text-base md:text-xl font-semibold tracking-[0.22em] uppercase text-foreground hover:text-primary transition-colors duration-200 select-none"
          >
            {title}
          </Link>
        ) : (
          <div className="w-12 h-px bg-border/30" />
        )}
      </div>

      {/* Right — nav + Discover + User */}
      <div className="flex items-center justify-end gap-5 flex-1">
        <nav className="hidden md:flex items-center gap-5 select-none" aria-label="Editor navigation secondary">
          <PrimaryNavRight pathname={pathname} />
        </nav>
        <DiscoverMenu pathname={pathname} />
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
        >
          <UserButton.MenuItems>
            <UserButton.Link
              label="Preferences"
              labelIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              href="/preferences"
            />
          </UserButton.MenuItems>
        </UserButton>
      </div>
    </header>
  );
}
