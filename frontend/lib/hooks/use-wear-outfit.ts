import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

export function useWearOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (outfitId: string) =>
      fetch(`/api/recommendations/${outfitId}/wear`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.outfits() });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}
