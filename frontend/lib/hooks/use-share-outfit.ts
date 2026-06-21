import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import type { Outfit } from "@/types";

export function useShareOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (outfitId: string) =>
      fetch(`/api/outfits/${outfitId}/share`, { method: "POST" }).then((r) => r.json()),
    onSuccess: (data, outfitId) => {
      if (data.success) {
        queryClient.setQueryData<Outfit[]>(QK.outfits(), (old) =>
          old?.map((o) =>
            o.id === outfitId ? { ...o, shareToken: data.data.token } : o
          ) ?? []
        );
      }
    },
  });
}

export function useRevokeShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (outfitId: string) =>
      fetch(`/api/outfits/${outfitId}/share`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: (data, outfitId) => {
      if (data.success) {
        queryClient.setQueryData<Outfit[]>(QK.outfits(), (old) =>
          old?.map((o) =>
            o.id === outfitId ? { ...o, shareToken: null } : o
          ) ?? []
        );
      }
    },
  });
}
