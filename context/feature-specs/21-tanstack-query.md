# TanStack Query — Feature Spec

## Overview

Replace the current `useEffect + fetch + useState` data-fetching pattern across all
client pages with **TanStack Query** (`@tanstack/react-query`).

Right now every page fetches independently, has no shared cache, refetches on every
mount (even if the data is identical to what the user saw 2 seconds ago), and applies
optimistic updates through awkward local state mutations. TanStack Query solves all of
this with a query cache, automatic background revalidation, deduplication, and a clean
optimistic-update API.

This is a frontend-only change. No API routes are modified. No database changes.

---

## Scope

**In scope:**
- Install `@tanstack/react-query` and its devtools
- Wrap the app root in `QueryClientProvider`
- Migrate every client-side data fetch to a `useQuery` or `useMutation` hook
- Implement optimistic updates for favorite toggles (garments + outfits) and wear/like/dislike actions
- Replace all `useState<Loading>` + `useEffect fetch` patterns

**Out of scope:**
- Server-side data fetching (Server Components stay as-is)
- Infinite scroll / pagination (not yet in the app)
- Persistence across sessions (no `localStorage` cache adapter)
- Suspense-mode queries

---

## Technical Approach

### Installation

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Provider Setup

Wrap `frontend/app/layout.tsx` (or a new `frontend/components/providers.tsx`
client wrapper) in `QueryClientProvider`:

```tsx
// frontend/components/providers.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        60_000,   // 1 min — data is fresh, no background refetch
      gcTime:           5 * 60_000, // 5 min — keep in cache after unmount
      retry:            1,
      refetchOnWindowFocus: false,  // editorial app, not a live dashboard
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

Add `<Providers>` inside the root `layout.tsx` body, wrapping `{children}`.

### Query Key Constants

```ts
// frontend/lib/query-keys.ts
export const QK = {
  garments:        () => ["garments"]                      as const,
  garment:         (id: string) => ["garments", id]        as const,
  outfits:         () => ["outfits"]                       as const,
  recommendations: (params: object) => ["recommendations", params] as const,
  planner:         (week: string)   => ["planner", week]   as const,
  insights:        () => ["insights"]                      as const,
  wearHistory:     () => ["wear-history"]                  as const,
  preferences:     () => ["preferences"]                   as const,
} as const;
```

---

## Query Hooks to Create

All custom hooks live in `frontend/lib/hooks/`.

### `useGarments`

```ts
// frontend/lib/hooks/use-garments.ts
export function useGarments() {
  return useQuery({
    queryKey: QK.garments(),
    queryFn:  () => fetch("/api/garments").then(r => r.json()).then(d => d.data as Garment[]),
  });
}
```

### `useOutfits`

```ts
// frontend/lib/hooks/use-outfits.ts
export function useOutfits() {
  return useQuery({
    queryKey: QK.outfits(),
    queryFn:  () => fetch("/api/outfits").then(r => r.json()).then(d => d.data as Outfit[]),
  });
}
```

### `useRecommendations`

```ts
// frontend/lib/hooks/use-recommendations.ts
export function useRecommendations(params: {
  lat?: number; lon?: number; city?: string; occasion?: string | null;
}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][]
  );
  return useQuery({
    queryKey: QK.recommendations(params),
    queryFn:  () => fetch(`/api/recommendations?${query}`).then(r => r.json()).then(d => d.data),
    enabled:  true,
  });
}
```

### `usePlanner`

```ts
// frontend/lib/hooks/use-planner.ts
export function usePlanner(week: string) {
  return useQuery({
    queryKey: QK.planner(week),
    queryFn:  () => fetch(`/api/planner?week=${week}`).then(r => r.json()).then(d => d.data),
  });
}
```

### `useInsights`

```ts
// frontend/lib/hooks/use-insights.ts
export function useInsights() {
  return useQuery({
    queryKey: QK.insights(),
    queryFn:  () => fetch("/api/insights").then(r => r.json()).then(d => d.data),
    staleTime: 5 * 60_000,  // insights are slow-moving
  });
}
```

### `useWearHistory`

```ts
// frontend/lib/hooks/use-wear-history.ts
export function useWearHistory() {
  return useQuery({
    queryKey: QK.wearHistory(),
    queryFn:  () => fetch("/api/wear-history").then(r => r.json()).then(d => d.data),
  });
}
```

---

## Mutation Hooks to Create

### `useToggleGarmentFavorite`

```ts
export function useToggleGarmentFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      fetch(`/api/garments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite }),
      }).then(r => r.json()),

    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: QK.garments() });
      const previous = queryClient.getQueryData<Garment[]>(QK.garments());
      queryClient.setQueryData<Garment[]>(QK.garments(), old =>
        old?.map(g => g.id === id ? { ...g, isFavorite } : g) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QK.garments(), ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QK.garments() }),
  });
}
```

### `useToggleOutfitFavorite`

Same pattern as above, targeting `QK.outfits()` and `PATCH /api/outfits/[id]`.

### `useCreateOutfit` / `useUpdateOutfit` / `useDeleteOutfit`

```ts
// on success: queryClient.invalidateQueries({ queryKey: QK.outfits() })
```

### `useWearOutfit`

```ts
// POST /api/recommendations/[id]/wear
// on success: invalidate QK.outfits() + QK.recommendations(...)
```

### `useLikeDislike`

```ts
// POST /api/recommendations/[id]/like  or  /dislike
// on success: invalidate QK.recommendations(...)
```

### `useShareOutfit` / `useRevokeShare`

```ts
// on success: update the outfit in QK.outfits() cache with the new shareToken
```

### `useGenerateOutfits`

```ts
// POST /api/outfits/generate
// on success: invalidate QK.outfits()
```

---

## Pages to Migrate

### `app/editor/wardrobe/page.tsx`

Replace:
```ts
const [garments, setGarments] = useState<Garment[]>([]);
const [fetchingGarments, setFetchingGarments] = useState(true);
const fetchGarments = async () => { ... };
useEffect(() => { fetchGarments(); }, []);
```

With:
```ts
const { data: garments = [], isLoading: fetchingGarments } = useGarments();
```

Same for outfits. Replace `fetchGarments()` / `fetchOutfits()` calls in success
callbacks with `queryClient.invalidateQueries(...)`.

Remove all the `useState` loading flags and the manual `fetch` functions.

### `app/editor/page.tsx` (dashboard / recommendations)

Replace `useEffect + fetch` for recommendations with `useRecommendations(params)`.
The occasion picker and location state remain as local `useState`; only the
server call moves to TanStack Query.

### `app/editor/planner/page.tsx`

Replace `useEffect + fetch` for planner data with `usePlanner(currentWeek)`.
Mutations (`createPlan`, `deletePlan`) use `useMutation` + invalidate `QK.planner(week)`.

### `app/insights/page.tsx`

Replace fetch + state with `useInsights()`. Single query, no mutations.

### `app/history/page.tsx`

Replace with `useWearHistory()`.

---

## Stale Times by Data Type

| Data | `staleTime` | Rationale |
|------|------------|-----------|
| Garments | 60 s | Changes only on upload / edit |
| Outfits | 60 s | Changes on create / edit / generate |
| Recommendations | 5 min | Expensive to compute; weather moves slowly |
| Planner | 60 s | User-driven scheduling |
| Insights | 5 min | Aggregates over wear history |
| Wear history | 60 s | Updated on wear events |
| Preferences | 5 min | Updated infrequently |

---

## New Files

```
frontend/lib/query-keys.ts
frontend/lib/hooks/use-garments.ts
frontend/lib/hooks/use-outfits.ts
frontend/lib/hooks/use-recommendations.ts
frontend/lib/hooks/use-planner.ts
frontend/lib/hooks/use-insights.ts
frontend/lib/hooks/use-wear-history.ts
frontend/lib/hooks/use-toggle-garment-favorite.ts
frontend/lib/hooks/use-toggle-outfit-favorite.ts
frontend/lib/hooks/use-create-outfit.ts
frontend/lib/hooks/use-update-outfit.ts
frontend/lib/hooks/use-delete-outfit.ts
frontend/lib/hooks/use-generate-outfits.ts
frontend/lib/hooks/use-wear-outfit.ts
frontend/lib/hooks/use-like-dislike.ts
frontend/lib/hooks/use-share-outfit.ts
frontend/components/providers.tsx
```

## Changed Files

```
frontend/package.json                          — add @tanstack/react-query + devtools
frontend/app/layout.tsx                        — wrap children in <Providers>
frontend/app/editor/wardrobe/page.tsx          — migrate garment + outfit fetching
frontend/app/editor/page.tsx                   — migrate recommendations fetching
frontend/app/editor/planner/page.tsx           — migrate planner fetching + mutations
frontend/app/insights/page.tsx                 — migrate insights fetching
frontend/app/history/page.tsx                  — migrate history fetching
```

---

## Scope Boundaries

**Do not:**
- Use TanStack Query in Server Components — they use `async/await` directly
- Add `suspense: true` mode — it requires wrapping every page in a `<Suspense>` boundary, which is a separate concern
- Replace the `toast` / `triggerToast` mechanism — keep the existing pattern
- Change API response shapes

---

## Check When Done

- `@tanstack/react-query` is in `frontend/package.json`
- `<Providers>` wraps the app in `layout.tsx`; `<ReactQueryDevtools>` visible in dev
- `useGarments()`, `useOutfits()`, `useRecommendations()` hooks exist and are used in their respective pages
- No `useEffect(() => { fetch(...) }, [])` patterns remain in the migrated pages
- Favorite toggle on a garment/outfit card is visually instant (optimistic update) and reverts on error
- Navigating away from the wardrobe page and back does **not** trigger a new network request if data is still fresh
- `npm run build` passes with no TypeScript errors
- The ReactQuery Devtools panel shows the correct cached queries in development
