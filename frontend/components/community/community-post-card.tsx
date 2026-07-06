"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { Heart, Bookmark, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunityPost } from "@/types";

interface CommunityPostCardProps {
  post: CommunityPost;
  onLike?: (post: CommunityPost) => void;
  onSave?: (post: CommunityPost) => void;
  onDelete?: (post: CommunityPost) => void;
  isDeleting?: boolean;
}

export function CommunityPostCard({ post, onLike, onSave, onDelete, isDeleting }: CommunityPostCardProps) {
  return (
    <div className="group relative flex flex-col bg-card border border-border/40 hover:border-border/80 transition-all duration-300 shadow-xs hover:shadow-md select-none rounded-none">
      <div className="aspect-4/5 w-full border-b border-border/20 overflow-hidden relative bg-[#fcf9f5] dark:bg-[#151513]">
        <img
          src={post.photoUrl}
          alt={post.caption ?? "Community look"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {post.occasion && (
          <div className="absolute top-4 left-4 z-20 px-2 py-1 bg-card/90 backdrop-blur-xs border border-border/40 text-[9px] font-sans uppercase font-bold tracking-wider text-muted-foreground">
            {post.occasion}
          </div>
        )}

        {onDelete && post.isOwnPost && (
          <button
            onClick={() => onDelete(post)}
            disabled={isDeleting}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-none border border-destructive/40 bg-card/90 backdrop-blur-xs flex items-center justify-center hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-all cursor-pointer shadow-sm opacity-0 group-hover:opacity-100"
            aria-label="Delete post"
            title="Delete post"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="flex flex-col p-5 gap-3 bg-card/60 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <img
            src={post.profile.avatarUrl}
            alt={post.profile.displayName}
            className="w-7 h-7 rounded-none object-cover border border-border/40 shrink-0"
          />
          <span className="font-sans text-xs font-semibold text-foreground truncate">
            {post.profile.displayName}
          </span>
        </div>

        {post.caption && (
          <p className="font-sans text-sm text-foreground/90 leading-relaxed line-clamp-2">
            {post.caption}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2 border-t border-border/10">
          <button
            onClick={() => onLike?.(post)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={post.isLikedByViewer ? "Unlike" : "Like"}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                post.isLikedByViewer ? "fill-primary text-primary" : ""
              )}
            />
            <span className="text-[11px] font-sans font-semibold">{post.likeCount}</span>
          </button>

          <button
            onClick={() => onSave?.(post)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label={post.isSavedByViewer ? "Unsave" : "Save"}
          >
            <Bookmark
              className={cn(
                "w-4 h-4 transition-colors",
                post.isSavedByViewer ? "fill-primary text-primary" : ""
              )}
            />
            <span className="text-[11px] font-sans font-semibold">{post.saveCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
