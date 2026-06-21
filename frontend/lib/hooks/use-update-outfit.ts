import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

export function useUpdateOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      fetch(`/api/outfits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK.outfits() }),
  });
}
