import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import type { Outfit } from "@/types";

export function useOutfits() {
  return useQuery({
    queryKey: QK.outfits(),
    queryFn: () =>
      fetch("/api/outfits")
        .then((r) => r.json())
        .then((d) => d.data as Outfit[]),
  });
}
