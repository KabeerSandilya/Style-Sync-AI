# Authentication Setup (Clerk)

Clerk is already installed and connected.

We are wiring authentication into the **StyleSync AI** Next.js application.

Authentication should feel minimal, premium, and consistent with the StyleSync editorial aesthetic.

The experience must follow:

* `ui-context.md`
* `globals.css`
* `code-standards.md`

Do **not** introduce generic SaaS auth styling.

---

## Design Requirements

Use Clerk’s:

`dark`

theme from:

`@clerk/ui/themes`

as the base theme.

### Theme Integration

Override Clerk appearance variables using the app’s existing CSS variables.

Do **not** hardcode:

* colors
* shadows
* radius
* typography values

All visual styling must inherit from the existing StyleSync theme system.

Must respect:

* sand/cream surfaces
* sage accent palette
* editorial typography
* rounded premium surfaces
* soft border system

No visual mismatch between Clerk and the application shell.

---

## Sign-In & Sign-Up Pages

Create:

* `/sign-in`
* `/sign-up`

using Clerk components.

### Layout Requirements

#### Large Screens

Use a **minimal two-panel editorial layout**.

### Left Panel

Compact brand presentation.

Contains:

#### Logo

Small and understated.

No oversized branding.

#### Tagline

Short and aspirational.

Example tone:

> Dress better with what you already own.

#### Supporting Text

One short paragraph describing StyleSync.

Focus:

* digital wardrobe
* AI outfit recommendations
* weather-aware styling

#### Minimal Feature List

Text-only.

No icons.

No cards.

No illustrations.

Example structure:

* Organize your wardrobe
* Get AI-powered outfit recommendations
* Dress for the weather

Keep spacing calm and compact.

---

### Right Panel

Contains:

* centered Clerk form
* vertically balanced layout
* comfortable spacing

The form should feel embedded into the StyleSync system — not like a third-party widget dropped onto the page.

---

### Small Screens

Form-only layout.

Requirements:

* centered vertically
* minimal padding
* no left informational panel
* optimized for fast sign-in

---

## Explicit Design Constraints

Avoid:

* gradients
* oversized hero sections
* feature cards
* long landing-page marketing layouts
* scroll-heavy auth screens
* generic dashboard aesthetics

The auth experience should feel:

**minimal, premium, editorial, and calm.**

---

## Implementation Requirements

### Root Layout

Wrap the root layout with:

`ClerkProvider`

using Clerk’s:

`dark`

theme.

Requirements:

* inherit existing CSS variables
* preserve app typography
* match StyleSync theme system

Do not replace or override the global design system.

---

### Route Protection

Use:

`proxy.ts`

at the project root.

Do **not** use:

`middleware.ts`

Requirements:

* define public auth routes
* protect everything else by default
* use existing Clerk sign-in/sign-up environment variables
* do not rename env vars
* do not invent new env vars

Public routes:

* `/sign-in`
* `/sign-up`

Everything else should require authentication.

---

### Root Route Behavior

Update:

`/`

Behavior:

#### Authenticated Users

Redirect to:

`/editor`

This becomes the authenticated app shell.

---

#### Unauthenticated Users

Redirect to:

`/sign-in`

No marketing homepage for MVP.

---

## Editor Navbar Integration

Add Clerk’s built-in:

`UserButton`

to the **right section** of:

`components/editor/editor-navbar.tsx`

Purpose:

* profile access
* account settings
* logout

Requirements:

* preserve navbar spacing
* visually integrate with editorial shell
* maintain warm, premium aesthetic

Do **not** rebuild or heavily customize Clerk internals.

Keep:

* default user menu
* profile flows
* authentication handling

Clerk remains the source of truth for identity.

---

## Dependencies

Install:

`@clerk/ui`

---

## Constraints

Do not:

* rewrite Clerk flows
* rebuild authentication UI manually
* replace Clerk profile pages
* invent custom auth state management
* hardcode theme colors

Always use:

* CSS variables
* theme tokens
* utility classes

Generated Clerk functionality should remain intact.

---

## Check When Done

* `proxy.ts` exists at project root
* all non-public routes are protected
* public auth routes work correctly
* `ClerkProvider` wraps root layout
* authenticated users redirect to `/editor`
* unauthenticated users redirect to `/sign-in`
* `UserButton` appears in editor navbar
* auth pages match `globals.css`
* no hardcoded colors exist
* no default Clerk styling clashes with StyleSync UI
* mobile auth layouts work correctly
* `npm run build` passes
* no TypeScript or lint errors
