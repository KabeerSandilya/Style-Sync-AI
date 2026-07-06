import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

interface AskStylistBody {
  query: string;
  lat?: number;
  lon?: number;
  city?: string;
}

export function useAskStylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AskStylistBody) =>
      fetch("/api/recommendations/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data?.mode === "generated") {
        queryClient.invalidateQueries({ queryKey: QK.outfits() });
        queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      }
    },
  });
}
