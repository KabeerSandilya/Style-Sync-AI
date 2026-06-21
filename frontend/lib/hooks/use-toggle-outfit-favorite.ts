import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import type { Outfit } from "@/types";

export function useToggleOutfitFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      fetch(`/api/outfits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite }),
      }).then((r) => r.json()),

    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: QK.outfits() });
      const previous = queryClient.getQueryData<Outfit[]>(QK.outfits());
      queryClient.setQueryData<Outfit[]>(QK.outfits(), (old) =>
        old?.map((o) => (o.id === id ? { ...o, isFavorite } : o)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QK.outfits(), ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QK.outfits() }),
  });
}
