import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

export function useGenerateOutfits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body?: object) =>
      fetch("/api/outfits/generate", {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK.outfits() }),
  });
}
