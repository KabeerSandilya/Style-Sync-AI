import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import type { Garment } from "@/types";

export function useGarments() {
  return useQuery({
    queryKey: QK.garments(),
    queryFn: async () => {
      const r = await fetch("/api/garments");
      if (!r.ok) throw new Error(`Failed to fetch garments: ${r.status}`);
      const d = await r.json();
      return (d.data as Garment[]) ?? [];
    },
  });
}
