"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { PlannerDayCard } from "@/components/planner/planner-day-card";
import { EmptyDaySlot } from "@/components/planner/empty-day-slot";
import { OutfitPickerSheet } from "@/components/planner/outfit-picker-sheet";
import { OutfitPlan, Outfit } from "@/types";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const OCCASION_STORAGE_KEY = "stylesync_occasion";

function getMonday(dateStr?: string | null): Date {
  const d = dateStr ? new Date(dateStr + "T00:00:00Z") : new Date();
  if (isNaN(d.getTime())) return getMonday(null);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}

function addDays(base: Date, n: number): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + n));
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = start.toLocaleDateString("en-US", opts);
  const e = end.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  return `Week of ${s} – ${e}`;
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function isToday(d: Date): boolean {
  const t = new Date();
  return (
    d.getUTCFullYear() === t.getFullYear() &&
    d.getUTCMonth() === t.getMonth() &&
    d.getUTCDate() === t.getDate()
  );
}

function isPast(d: Date): boolean {
  const t = new Date();
  const today = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()));
  return d < today;
}

function PlannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [weekStart, setWeekStart] = React.useState<Date>(() =>
    getMonday(searchParams.get("week"))
  );
  const [plans, setPlans] = React.useState<OutfitPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [suggestingDates, setSuggestingDates] = React.useState<Set<string>>(new Set());
  const [pickerDate, setPickerDate] = React.useState<string | null>(null);
  const [changingPlan, setChangingPlan] = React.useState<{ planId: string; date: string } | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchPlans = React.useCallback(async (ws: Date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/planner?week=${toISO(ws)}`);
      const data = await res.json();
      if (data.success) setPlans(data.plans ?? []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPlans(weekStart);
    router.replace(`/editor/planner?week=${toISO(weekStart)}`, { scroll: false });
  }, [weekStart, fetchPlans, router]);

  const planByDate = React.useMemo(() => {
    const map: Record<string, OutfitPlan> = {};
    for (const p of plans) {
      map[p.plannedDate.slice(0, 10)] = p;
    }
    return map;
  }, [plans]);

  const handlePrevWeek = () => setWeekStart((ws) => addDays(ws, -7));
  const handleNextWeek = () => setWeekStart((ws) => addDays(ws, 7));

  const handlePickOutfit = (date: string) => setPickerDate(date);
  const handleChangeOutfit = (planId: string, date: string) =>
    setChangingPlan({ planId, date });

  const assignOutfit = async (outfit: Outfit, date: string, existingPlanId?: string) => {
    try {
      if (existingPlanId) {
        await fetch(`/api/planner/${existingPlanId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outfitId: outfit.id }),
        });
      } else {
        await fetch("/api/planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outfitId: outfit.id, plannedDate: date }),
        });
      }
      await fetchPlans(weekStart);
    } catch {
      // silent
    }
  };

  const handlePickerSelect = async (outfit: Outfit) => {
    if (!pickerDate) return;
    setPickerDate(null);
    await assignOutfit(outfit, pickerDate);
  };

  const handleChangerSelect = async (outfit: Outfit) => {
    if (!changingPlan) return;
    const { planId, date } = changingPlan;
    setChangingPlan(null);
    await assignOutfit(outfit, date, planId);
  };

  const handleRemove = async (planId: string) => {
    try {
      await fetch(`/api/planner/${planId}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch {
      // silent
    }
  };

  const handleSuggest = async (date: string) => {
    setSuggestingDates((prev) => new Set(prev).add(date));

    const storedOccasion =
      typeof window !== "undefined" ? localStorage.getItem(OCCASION_STORAGE_KEY) : null;
    const occasion =
      storedOccasion && storedOccasion !== "null" ? storedOccasion : undefined;

    try {
      const url = occasion
        ? `/api/recommendations?occasion=${encodeURIComponent(occasion)}`
        : "/api/recommendations";
      const res = await fetch(url);
      const data = await res.json();
      const top: Outfit | undefined = data.recommendations?.[0]?.outfit;
      if (top) {
        await fetch("/api/planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            outfitId: top.id,
            plannedDate: date,
            occasion: occasion ?? null,
          }),
        });
        await fetchPlans(weekStart);
      }
    } catch {
      // silent
    } finally {
      setSuggestingDates((prev) => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });
    }
  };

  const pickerOpen = pickerDate !== null || changingPlan !== null;

  return (
    <div className="min-h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen((v) => !v)}
        title="StyleSync AI"
      />

      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-sans font-medium mb-1">
            Weekly Planner
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-foreground">
            Plan Your Week
          </h1>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handlePrevWeek}
            className="w-8 h-8 flex items-center justify-center border border-border/50 hover:bg-accent/40 hover:border-border transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="font-sans text-sm text-foreground font-medium tracking-wide">
            {formatWeekLabel(weekStart, weekEnd)}
          </span>
          <button
            onClick={handleNextWeek}
            className="w-8 h-8 flex items-center justify-center border border-border/50 hover:bg-accent/40 hover:border-border transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 7-column week grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {weekDays.map((day, i) => {
            const dateStr = toISO(day);
            const plan = planByDate[dateStr];
            const today = isToday(day);
            const past = isPast(day);

            return (
              <div
                key={dateStr}
                className={today ? "border-l-2 border-l-primary/50 pl-1" : ""}
              >
                {/* Day header */}
                <div className="mb-1.5">
                  <p
                    className={`text-[9px] uppercase tracking-widest font-sans font-bold ${
                      today ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {DAY_NAMES[i]}
                  </p>
                  <p
                    className={`text-xs font-sans font-medium ${
                      today ? "text-primary" : "text-foreground/80"
                    }`}
                  >
                    {formatDayLabel(day)}
                  </p>
                </div>

                {loading ? (
                  <div className="aspect-square w-full bg-accent/15 animate-pulse" />
                ) : plan ? (
                  <PlannerDayCard
                    plan={plan}
                    onRemove={handleRemove}
                    onChangeOutfit={handleChangeOutfit}
                  />
                ) : (
                  <EmptyDaySlot
                    isPast={past}
                    isSuggesting={suggestingDates.has(dateStr)}
                    onPickOutfit={() => handlePickOutfit(dateStr)}
                    onSuggest={() => handleSuggest(dateStr)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Outfit picker for empty day */}
      <OutfitPickerSheet
        open={pickerDate !== null}
        onClose={() => setPickerDate(null)}
        onSelect={handlePickerSelect}
      />

      {/* Outfit picker for changing an existing plan */}
      <OutfitPickerSheet
        open={changingPlan !== null}
        onClose={() => setChangingPlan(null)}
        onSelect={handleChangerSelect}
      />
    </div>
  );
}

export default function PlannerPage() {
  return (
    <React.Suspense fallback={null}>
      <PlannerContent />
    </React.Suspense>
  );
}
