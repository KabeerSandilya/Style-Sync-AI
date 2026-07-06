"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUpsertCommunityProfile } from "@/lib/hooks/use-community";
import type { CommunityProfile } from "@/types";

interface CommunityProfileSetupProps {
  existingProfile?: CommunityProfile | null;
  onSuccess?: () => void;
}

export function CommunityProfileSetup({ existingProfile, onSuccess }: CommunityProfileSetupProps) {
  const { user } = useUser();
  const upsertProfile = useUpsertCommunityProfile();

  const [displayName, setDisplayName] = React.useState(
    existingProfile?.displayName ?? user?.fullName ?? user?.username ?? ""
  );
  const [avatarUrl] = React.useState(existingProfile?.avatarUrl ?? user?.imageUrl ?? "");
  const [isPrivate, setIsPrivate] = React.useState(existingProfile?.isPrivate ?? false);
  const [error, setError] = React.useState<string | null>(null);

  const loading = upsertProfile.isPending;

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError("Add a display name to continue.");
      return;
    }
    if (!avatarUrl) {
      setError("An avatar is required.");
      return;
    }
    setError(null);

    try {
      const result = await upsertProfile.mutateAsync({
        displayName: displayName.trim(),
        avatarUrl,
        isPrivate,
      });
      if (!result.success) throw new Error(result.error || "Failed to save profile.");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Avatar preview"
            className="w-14 h-14 rounded-none object-cover border border-border/40 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 bg-accent/40 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your avatar is pulled from your account and shown on every post you publish.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
          Display Name
        </label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
          disabled={loading}
          maxLength={40}
          placeholder="How you'll appear to others"
          className="rounded-none bg-background/40 border-border/80 focus-visible:ring-primary/40 focus-visible:border-primary/60"
        />
      </div>

      <div className="flex items-center justify-between gap-4 border border-border/40 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-foreground">Private profile</span>
          <span className="text-[11px] text-muted-foreground leading-relaxed">
            Hides all of your posts from the Community feed and Trending.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsPrivate((v) => !v)}
          disabled={loading}
          className={cn(
            "relative w-10 h-5.5 shrink-0 transition-colors cursor-pointer",
            isPrivate ? "bg-primary" : "bg-muted-foreground/30"
          )}
          aria-pressed={isPrivate}
          aria-label="Toggle private profile"
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-background transition-transform",
              isPrivate && "translate-x-4.5"
            )}
          />
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-3 animate-fade-in">
          {error}
        </div>
      )}

      <Button
        type="button"
        disabled={loading}
        onClick={handleSubmit}
        className="rounded-none px-6 py-5 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 self-start"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Profile"
        )}
      </Button>
    </div>
  );
}
