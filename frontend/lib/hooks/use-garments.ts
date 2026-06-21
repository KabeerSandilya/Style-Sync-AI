import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import type { Garment } from "@/types";

export function useGarments() {
  return useQuery({
    queryKey: QK.garments(),
    queryFn: () =>
      fetch("/api/garments")
        .then((r) => r.json())
        .then((d) => d.data as Garment[]),
  });
}
