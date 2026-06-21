import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import type { OutfitPlan } from "@/types";

export function usePlanner(week: string) {
  return useQuery({
    queryKey: QK.planner(week),
    queryFn: () =>
      fetch(`/api/planner?week=${week}`)
        .then((r) => r.json())
        .then((d) => (d.plans ?? []) as OutfitPlan[]),
  });
}
