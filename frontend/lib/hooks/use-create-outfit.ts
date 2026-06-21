import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

export function useCreateOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: object) =>
      fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK.outfits() }),
  });
}
