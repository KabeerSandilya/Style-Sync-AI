import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

export function useInsights() {
  return useQuery({
    queryKey: QK.insights(),
    queryFn: () =>
      fetch("/api/insights")
        .then((r) => r.json())
        .then((d) => d.data),
    staleTime: 5 * 60_000,
  });
}
