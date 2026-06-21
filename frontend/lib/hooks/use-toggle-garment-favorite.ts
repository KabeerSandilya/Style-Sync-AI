import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import type { Garment } from "@/types";

export function useToggleGarmentFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      fetch(`/api/garments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite }),
      }).then((r) => r.json()),

    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: QK.garments() });
      const previous = queryClient.getQueryData<Garment[]>(QK.garments());
      queryClient.setQueryData<Garment[]>(QK.garments(), (old) =>
        old?.map((g) => (g.id === id ? { ...g, isFavorite } : g)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QK.garments(), ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QK.garments() }),
  });
}
