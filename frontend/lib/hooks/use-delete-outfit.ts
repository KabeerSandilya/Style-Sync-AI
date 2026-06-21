import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

export function useDeleteOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/outfits/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK.outfits() }),
  });
}
