import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import type { LookBookEntry } from "@/types";

export interface LookBookFilters {
  month?: string;
  mood?: string;
  rating?: number;
  occasion?: string;
}

interface LookBookPage {
  data: LookBookEntry[];
  nextCursor: string | null;
}

function buildQueryString(filters: LookBookFilters, cursor?: string) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (filters.month) params.set("month", filters.month);
  if (filters.mood) params.set("mood", filters.mood);
  if (filters.rating) params.set("rating", String(filters.rating));
  if (filters.occasion) params.set("occasion", filters.occasion);
  return params.toString();
}

export function useLookBookEntries(filters: LookBookFilters = {}) {
  return useInfiniteQuery<LookBookPage>({
    queryKey: QK.lookBook(filters),
    queryFn: async ({ pageParam }) => {
      const qs = buildQueryString(filters, pageParam as string | undefined);
      const res = await fetch(`/api/lookbook?${qs}`);
      const json = await res.json();
      return { data: json.data ?? [], nextCursor: json.nextCursor ?? null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useLookBookEntry(id: string | null) {
  return useQuery<LookBookEntry | null>({
    queryKey: QK.lookBookEntry(id ?? ""),
    queryFn: () =>
      fetch(`/api/lookbook/${id}`)
        .then((r) => r.json())
        .then((d) => d.data ?? null),
    enabled: !!id,
  });
}

export function useCreateLookBookEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      fetch("/api/lookbook", { method: "POST", body: formData }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["lookbook"] });
      }
    },
  });
}

export function useUpdateLookBookEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; [key: string]: unknown }) =>
      fetch(`/api/lookbook/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["lookbook"] });
      }
    },
  });
}

export function useDeleteLookBookEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetch(`/api/lookbook/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["lookbook"] });
      }
    },
  });
}
