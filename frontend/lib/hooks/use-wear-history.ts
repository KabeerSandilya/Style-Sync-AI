import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

export function useWearHistory() {
  return useQuery({
    queryKey: QK.wearHistory(),
    queryFn: () =>
      fetch("/api/wear-history")
        .then((r) => r.json())
        .then((d) => d.data ?? []),
  });
}
