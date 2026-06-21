import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

interface RecommendationParams {
  lat?: number;
  lon?: number;
  city?: string;
  occasion?: string | null;
}

export function useRecommendations(params: RecommendationParams) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][]
  );
  return useQuery({
    queryKey: QK.recommendations(params),
    queryFn: () =>
      fetch(`/api/recommendations?${query}`)
        .then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
}
