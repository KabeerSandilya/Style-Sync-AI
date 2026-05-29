Read `AGENTS.md` before starting.

We are setting up the **foundational design system and UI primitives** for **StyleSync AI**.

The implementation must follow the established UI context:

* Warm editorial fashion aesthetic
* Premium wardrobe feel
* Sand/cream surfaces
* Sage accent palette
* Rounded premium cards
* Serif + sans typography pairing
* No generic SaaS or dashboard-heavy styling

## Install & Configure

Install and configure `shadcn/ui`.

The project uses:

* Tailwind CSS
* shadcn/ui
* Lucide React
* Existing design tokens from `globals.css`

Ensure shadcn is configured to work with the existing theme system and CSS variables.

Do **not** introduce a default shadcn appearance.

All primitives must inherit the existing design language defined in:

* `ui-context.md`
* `globals.css`

---

## Install Required Components

Add the following shadcn components:

* Button
* Card
* Dialog
* Input
* Tabs
* Textarea
* ScrollArea

These components will be used across:

* onboarding
* wardrobe upload
* outfit builder
* AI recommendations
* profile/settings
* modal interactions

### Styling Rules

All components must visually align with the existing StyleSync design system.

Requirements:

#### Buttons

* Rounded and premium feeling
* Soft transitions
* Sage accent variants
* No aggressive default blue styles

#### Cards

* Rounded (`rounded-2xl` / `rounded-3xl`)
* Sand/cream surfaces
* Subtle borders
* Gentle shadowing
* Editorial spacing

#### Dialogs

* Soft modal overlays
* Large rounded corners
* Calm premium feel
* No harsh shadows

#### Inputs & Textareas

* Soft borders
* Cream surfaces
* Elegant focus states
* Consistent spacing
* Match onboarding aesthetic

#### Tabs

* Boutique storefront feel
* Minimal and premium
* Avoid dashboard-style segmented controls

#### ScrollArea

* Subtle scrollbars
* Non-intrusive styling

---

## Constraints

Do **not** modify generated `components/ui/*` files after installation.

Customization must happen through:

* theme tokens
* `globals.css`
* utility classes
* wrapper components (if necessary)

Never directly edit generated shadcn primitives.

---

## Icons

Install `lucide-react`.

Use Lucide icons only.

Follow sizing conventions from `ui-context.md`:

* labels → `w-3.5 h-3.5`
* buttons → `w-4 h-4`
* section headers → `w-5 h-5`

Prefer stroke-based, minimal icons.

---

## Utilities

Create:

`lib/utils.ts`

Add a reusable `cn()` helper for merging Tailwind classes.

Requirements:

* reusable across all components
* compatible with shadcn/ui
* supports conditional class merging
* works with Tailwind conflict resolution

---

## Theme Requirements

Ensure **all UI primitives inherit the existing StyleSync theme**.

The application must preserve:

* warm editorial visual language
* sand backgrounds
* sage accents
* cream surfaces
* serif/sans typography pairing
* premium fashion mood

### Explicitly Avoid

* default shadcn light theme
* blue focus rings
* generic grayscale cards
* harsh borders
* overly technical SaaS styling
* inconsistent radius values

No default light styling should appear anywhere.

Everything should feel cohesive with the wardrobe/fashion experience.

---

## Check When Done

* All shadcn components import without errors
* `cn()` works properly
* No default shadcn light styling appears
* Components visually match `globals.css`
* Components align with `ui-context.md`
* No generated `components/ui/*` files were modified
* Typography hierarchy remains intact
* Border radius scale follows UI context
* No visual regressions in dark/editorial theme
