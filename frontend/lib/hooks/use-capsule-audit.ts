import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";

export function useCapsuleAudit() {
  return useQuery({
    queryKey: QK.capsuleAudit(),
    queryFn: () => fetch("/api/insights/capsule").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });
}
