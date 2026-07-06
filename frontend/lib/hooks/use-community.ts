import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import type { CommunityProfile, CommunityPost } from "@/types";

export interface CommunityFeedFilters {
  tab: "feed" | "saved";
  sort: "newest" | "trending";
  occasion?: string;
}

interface CommunityFeedPage {
  data: CommunityPost[];
  nextCursor: string | null;
}

function buildQueryString(filters: CommunityFeedFilters, cursor?: string) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("tab", filters.tab);
  params.set("sort", filters.sort);
  if (filters.occasion) params.set("occasion", filters.occasion);
  return params.toString();
}

export function useCommunityProfile() {
  return useQuery<CommunityProfile | null>({
    queryKey: QK.communityProfile(),
    queryFn: () =>
      fetch("/api/community/profile")
        .then((r) => r.json())
        .then((d) => d.data ?? null),
  });
}

// Narrow single-purpose lookup for "is this entry already published?" — not the paginated feed.
export function useCommunityPostBySource(sourceLookBookEntryId: string | null) {
  return useQuery<CommunityPost | null>({
    queryKey: ["community", "post-by-source", sourceLookBookEntryId],
    queryFn: () =>
      fetch(`/api/community?sourceLookBookEntryId=${sourceLookBookEntryId}`)
        .then((r) => r.json())
        .then((d) => d.data ?? null),
    enabled: !!sourceLookBookEntryId,
  });
}

export function usePublishToCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { sourceLookBookEntryId: string; caption?: string; occasion?: string }) =>
      fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
        queryClient.invalidateQueries({
          queryKey: ["community", "post-by-source", variables.sourceLookBookEntryId],
        });
      }
    },
  });
}

export function useUpsertCommunityProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { displayName: string; avatarUrl: string; isPrivate: boolean }) =>
      fetch("/api/community/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: QK.communityProfile() });
      }
    },
  });
}

// Trending is a fixed, non-paginated top-20 snapshot; newest/saved are cursor-paginated.
export function useCommunityFeed(filters: CommunityFeedFilters) {
  const isPaginated = filters.sort !== "trending";

  const infinite = useInfiniteQuery<CommunityFeedPage>({
    queryKey: QK.communityFeed(filters),
    queryFn: async ({ pageParam }) => {
      const qs = buildQueryString(filters, pageParam as string | undefined);
      const res = await fetch(`/api/community?${qs}`);
      const json = await res.json();
      return { data: json.data ?? [], nextCursor: json.nextCursor ?? null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isPaginated,
  });

  const flat = useQuery<CommunityPost[]>({
    queryKey: QK.communityFeed(filters),
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const res = await fetch(`/api/community?${qs}`);
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !isPaginated,
  });

  if (isPaginated) {
    return {
      data: infinite.data?.pages.flatMap((p) => p.data) ?? [],
      isLoading: infinite.isLoading,
      fetchNextPage: infinite.fetchNextPage,
      hasNextPage: infinite.hasNextPage,
      isFetchingNextPage: infinite.isFetchingNextPage,
    };
  }

  return {
    data: flat.data ?? [],
    isLoading: flat.isLoading,
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      fetch(`/api/community/${postId}/like`, { method: "POST" }).then((r) => r.json()),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}

export function useSavePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      fetch(`/api/community/${postId}/save`, { method: "POST" }).then((r) => r.json()),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });
}

export function useDeleteCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) =>
      fetch(`/api/community/${postId}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
      }
    },
  });
}
