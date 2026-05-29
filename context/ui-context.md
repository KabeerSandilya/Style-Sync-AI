## Design Principles

- The UI should feel like a premium fashion editorial experience, not a dashboard-heavy SaaS product.
- Interfaces should feel calm, breathable, and tactile with generous spacing and restrained visual density.
- Prioritize clarity and visual hierarchy over feature compression.
- Interactions should feel soft and premium rather than mechanical or overly animated.
- Every screen should maintain wardrobe/fashion emotional resonance.

### Design Hierarchy

The interface hierarchy should follow:

1. Visual aspiration (outfits, wardrobe, style)
2. User intent (actions and flows)
3. Metadata (labels, metrics, secondary information)

Avoid admin-dashboard visual patterns unless inside internal tooling.

---

## Spacing System

Maintain a consistent spacing rhythm across all screens.

| Context               | Preferred Spacing |
| --------------------- | ----------------- |
| Tight UI groups       | `gap-2`, `gap-3`  |
| Form groups           | `gap-4`, `gap-5`  |
| Cards and sections    | `gap-6`, `gap-8`  |
| Major layout sections | `py-16`, `py-24`  |

Rules:

- Avoid cramped interfaces.
- Prefer whitespace over dividers.
- Use borders sparingly.
- Allow wardrobe cards to breathe.

---

## Elevation & Shadows

Shadows should remain soft and subtle.

| Context      | Style               |
| ------------ | ------------------- |
| Cards        | soft, low elevation |
| Hover states | slightly elevated   |
| Modals       | medium elevation    |
| Floating UI  | soft layered shadow |

Rules:

- Avoid harsh shadows.
- Avoid glassmorphism-heavy UI.
- Avoid excessive blur.
- Premium fashion > startup SaaS aesthetic.

---

## Motion Principles

Motion should feel intentional and elegant.

### Use Motion For

- Wardrobe item hover
- Outfit transitions
- Recommendation loading
- Drag-and-drop feedback
- Modal entrances
- Success feedback

### Avoid Motion For

- Decorative animations
- Constant movement
- Excessive parallax
- Bouncy interactions

Recommended motion feel:

- Smooth easing
- Slight fade + translate
- Subtle scale on interaction

The product should feel editorial and premium.

---

## Wardrobe Grid Patterns

Wardrobe grids are a core product surface.

Rules:

- Clothing cards must prioritize garment imagery.
- Metadata should feel secondary.
- Use spacious card layouts.
- Filters should remain lightweight and unobtrusive.
- Grid density should adapt responsively.

Wardrobe card hierarchy:

1. Garment image
2. Clothing type
3. Color/style metadata
4. Contextual tags

Hover states:

- Slight elevation
- Soft shadow increase
- Quick actions revealed progressively

Avoid cluttered card controls.

---

## Outfit Builder UX

The outfit builder should feel tactile and playful.

Rules:

- Drag-and-drop interactions should feel smooth.
- Outfit canvas must remain visually clean.
- Clothing pieces should snap naturally into outfit positions.
- Outfit creation should feel creative, not technical.

Interaction priority:

1. Visual composition
2. Ease of experimentation
3. Fast editing

Avoid:

- Dense sidebars
- Excessive controls
- Overwhelming configuration menus

---

## AI Recommendation Experience

AI should feel assistive, not robotic.

Recommendation cards should include:

- Outfit visual preview
- Why this outfit works
- Weather reasoning
- Occasion compatibility

Tone:

- Confident
- Helpful
- Minimal
- Non-technical

Bad:

> Based on humidity thresholds...

Good:

> Light fabrics work better today because of the heat.

The AI experience should feel like a personal stylist.

---

## Forms & Onboarding

Onboarding must feel lightweight and premium.

Rules:

- Prefer progressive disclosure.
- Break onboarding into short steps.
- Use visual selections over long forms.
- Keep friction minimal.

Examples:

Prefer:

- style chips
- outfit imagery
- swipeable preferences

Avoid:

- long questionnaires
- technical settings upfront

---

## Loading States

Loading should preserve perceived polish.

Rules:

- Use skeleton states instead of spinners.
- Preserve layout stability.
- Recommendation loading should feel intentional.

Wardrobe loading:

- Image placeholders
- Soft pulse effect

Recommendation loading:

- Editorial card skeletons

Avoid jarring layout shifts.

---

## Responsive Rules

Mobile experience is critical.

Priority order:

1. Wardrobe browsing
2. Outfit recommendations
3. Outfit builder
4. Avatar interaction

Rules:

- Mobile-first wardrobe grids
- Sticky bottom actions where helpful
- Avoid hover-only interactions
- Drag-and-drop must degrade gracefully

---

## Accessibility Rules

- Maintain sufficient contrast ratios.
- Never rely solely on color for feedback.
- All actions must have visible focus states.
- Interactive elements should remain comfortably tappable.
- Typography should prioritize readability over decoration.

Serif fonts are for emphasis, never readability-critical UI.

---

## Future 3D / Avatar Guidelines

When avatar systems are introduced:

- Maintain the same editorial aesthetic.
- Avoid gaming-style UI.
- Avatar viewers should feel premium and fashion-oriented.
- Keep controls minimal and intuitive.

The experience should feel closer to luxury retail than a game character editor.
