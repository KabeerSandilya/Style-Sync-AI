import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useLikeDislike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ outfitId, action }: { outfitId: string; action: "like" | "dislike" }) =>
      fetch(`/api/recommendations/${outfitId}/${action}`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}
