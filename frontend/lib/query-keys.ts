export const QK = {
  garments:        () => ["garments"]                          as const,
  garment:         (id: string) => ["garments", id]            as const,
  outfits:         () => ["outfits"]                           as const,
  recommendations: (params: object) => ["recommendations", params] as const,
  planner:         (week: string) => ["planner", week]         as const,
  insights:        () => ["insights"]                          as const,
  wearHistory:     () => ["wear-history"]                      as const,
  preferences:     () => ["preferences"]                       as const,
} as const;
