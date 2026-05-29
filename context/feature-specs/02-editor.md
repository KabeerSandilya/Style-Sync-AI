# Editor Shell Requirements

We need the **foundational application chrome** that frames every authenticated StyleSync experience.

These components act as the reusable shell for:

* wardrobe management
* outfit builder
* AI recommendations
* profile/settings
* future avatar experience

They should be reusable and extended throughout future implementation units.

The UI must strictly follow:

* `ui-context.md`
* `globals.css`
* StyleSync design principles

The shell should feel **premium, editorial, calm, and fashion-first** — not like a technical admin dashboard.

---

## App Navbar

Create:

`components/editor/editor-navbar.tsx`

### Requirements

* fixed-height top navbar
* sticky top positioning
* left, center, and right sections
* translucent warm sand background
* subtle backdrop blur
* thin bottom border
* maintain premium editorial feel

### Left Section

Contains:

#### Sidebar Toggle Button

Behavior:

* toggles wardrobe sidebar visibility
* use:

`PanelLeftOpen`

and

`PanelLeftClose`

icons based on sidebar state

Button styling:

* rounded-full
* soft hover states
* subtle border
* warm neutral background
* no harsh icon buttons

---

### Center Section

Reserved for contextual page information.

Examples (future use):

* "My Wardrobe"
* "Outfit Builder"
* "Today's Recommendations"

For now:

* keep visually balanced
* minimal placeholder spacing
* no hardcoded text

---

### Right Section

Reserved for future actions:

Examples:

* notifications
* profile avatar
* save actions
* AI assistant shortcuts

For now:

* remain empty
* preserve layout spacing

---

### Styling Requirements

Navbar should match StyleSync theme:

* warm editorial aesthetic
* soft sand surface
* sage accent compatibility
* premium spacing
* subtle shadows
* no generic dark SaaS styling

Avoid:

* black/navy dashboards
* sharp borders
* technical toolbar feeling

---

## Wardrobe Sidebar

Create:

`components/editor/project-sidebar.tsx`

This sidebar represents the **user wardrobe navigation shell**.

### Requirements

* sidebar floats above content
* opening sidebar must **not push page content**
* smooth slide-in from left
* layered above editor canvas
* supports:

```ts
isOpen: boolean
onClose: () => void
```

Behavior:

* smooth transitions
* dismissible
* optimized for future mobile support

---

### Sidebar Header

Include:

#### Title

`Wardrobe`

Typography:

* serif headline
* premium editorial feel

#### Close Button

Uses:

`X`

icon

Styling:

* soft hover
* rounded-full
* visually subtle

---

## Sidebar Navigation Pattern

Use shadcn:

`Tabs`

Tabs:

### My Wardrobe

Shows:

* empty placeholder state

Future purpose:

* uploaded clothing
* saved collections
* outfit folders

---

### Saved Outfits

Shows:

* empty placeholder state

Future purpose:

* saved recommendations
* created outfits
* favorite looks

---

### Placeholder State

Must feel polished and intentional.

Include:

* lightweight empty-state messaging
* soft muted typography
* spacious layout

Avoid:

* generic blank states
* dense empty panels

Tone:

Premium fashion app.

Example feel:

> Your wardrobe will appear here.

—not—

> No data available.

---

## Primary CTA

Bottom anchored button:

### Add Clothing

Requirements:

* full width
* uses `Plus` icon
* premium styling
* rounded-xl or rounded-2xl
* follows sage accent system
* visually prominent but elegant

Future behavior:

* launches upload flow

Do not implement upload functionality yet.

---

## Dialog Pattern

Prepare a reusable visual pattern for dialogs.

Do **not** build actual dialogs yet.

Must support:

* title
* description
* footer actions

Dialog styling requirements:

* use tokens from `globals.css`
* cream/sand surfaces
* soft border treatment
* premium rounded corners
* editorial spacing
* calm modal aesthetic

Should feel closer to a luxury retail modal than a SaaS popup.

Avoid:

* default shadcn modal styling
* harsh shadows
* stark contrast panels

---

## Constraints

Do **not** modify generated:

`components/ui/*`

after shadcn generation.

Customization must happen through:

* wrapper components
* utility classes
* theme tokens
* `globals.css`

---

## Check When Done

* components compile without TypeScript errors
* no lint errors
* sidebar overlays content correctly
* navbar spacing remains visually balanced
* no default shadcn styling appears
* components match `ui-context.md`
* editorial visual language is preserved
* dialog pattern is ready for future use
* mobile responsiveness is not broken
