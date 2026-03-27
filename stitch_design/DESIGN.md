# Design System Strategy: Financial Editorial 2026

## 1. Overview & Creative North Star: "The Digital Ledger"
The objective is to move away from the "utility-first" clutter of 2020s fintech and toward a high-end, editorial experience. We are not building a dashboard; we are curating a financial narrative. 

**The Creative North Star: The Digital Ledger.**
Think of a bespoke, leather-bound financial journal reimagined for a high-performance digital era. This system breaks the "template" look through **Intentional Asymmetry** (offsetting headers from data grids) and **Tonal Depth**. We prioritize breathing room over information density. By utilizing extreme whitespace and a sophisticated type scale, we transform cold numbers into a trustworthy, premium experience.

---

## 2. Colors: Depth Beyond Borders
This system moves away from "boxes" and toward "surfaces." We use color not just for branding, but for spatial orientation.

*   **Primary (#000666 / #1A237E):** Our "Ink." Used for high-authority elements and deep-background hero sections.
*   **Secondary (#1B6D24):** Our "Growth." Used exclusively for positive growth and success states.
*   **Tertiary (#400007 / #E57373):** Our "Attention." Used for pending states and items requiring a soft nudge.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts.
*   Use `surface-container-low` for secondary information blocks sitting on a `surface` background.
*   Use `surface-container-highest` for the most prominent interactive modules. 
*   Physicality is achieved via tonal contrast, not "lines" that clutter the eye.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked sheets of fine paper. 
*   **Level 0:** `surface` (The base canvas).
*   **Level 1:** `surface-container-low` (General grouping).
*   **Level 2:** `surface-container-highest` (Individual cards or focus areas).
*   **Nesting:** An "Account Card" (`surface-container-highest`) should live inside a "Portfolio Section" (`surface-container-low`), creating natural depth.

### The "Glass & Gradient" Rule
To elevate the primary CTAs, use a subtle linear gradient from `primary` (#000666) to `primary_container` (#1A237E) at a 135-degree angle. For floating navigation or modal overlays, apply **Glassmorphism**: use `surface_container_lowest` at 80% opacity with a `24px` backdrop-blur.

---

## 3. Typography: The Editorial Voice
We use a dual-typeface strategy to balance authority with modern clarity.

*   **Display & Headlines (Manrope):** The "Voice." Manrope’s geometric yet warm proportions provide a modern, high-end feel. Use `display-lg` (3.5rem) for total balances to make wealth feel substantial.
*   **Body & Labels (Inter):** The "Data." Inter is utilized for its exceptional legibility at small sizes. Use `body-md` (0.875rem) for transaction details and `label-sm` (0.6875rem) for micro-metadata.
*   **Hierarchy Tip:** Pair a `headline-sm` title with a `body-lg` description to create a high-contrast, "magazine" style layout that guides the eye effortlessly.

---

## 4. Elevation & Depth
In this system, depth is "felt," not "seen."

*   **The Layering Principle:** Avoid shadows for static elements. If a card needs to stand out, place a `surface-container-lowest` card on a `surface-container-high` background.
*   **Ambient Shadows:** For "floating" elements (Modals, FABs), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(27, 27, 33, 0.06)`. The shadow color is a tint of `on_surface`, not a generic black.
*   **The "Ghost Border" Fallback:** If accessibility requires a border (e.g., in high-glare environments), use the `outline_variant` token at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons: High-Performance Actions
*   **Primary:** Gradient-filled (Primary to Primary-Container), `xl` (0.75rem) corner radius. Use `on_primary` for text.
*   **Secondary:** Ghost style. No background, no border. Use `primary` text weight 600.
*   **Tertiary:** `surface-container-highest` background with `on_surface` text for low-priority actions.

### Cards & Lists: The No-Divider Rule
*   **Forbid Dividers:** Do not use line separators between transactions.
*   **Spacing as Separation:** Use `spacing-4` (1.4rem) between list items. Use subtle background shifts (`surface-container-low` alternating) if the list exceeds 10 items.

### Input Fields: Clean Slate
*   **Style:** Minimalist. No bottom line, no full box. Use a `surface-container-low` background with an `xl` (0.75rem) radius.
*   **Focus:** Transition background to `surface-container-highest` and add a "Ghost Border" of `primary` at 20% opacity.

### Unique Component: The "Balance Glancer"
A large-scale `display-md` typography component that uses a `secondary` (emerald) soft glow behind the text when the monthly balance is positive, signaling health without using a box or icon.

---

## 6. Do’s and Don'ts

### Do:
*   **Do** use asymmetrical margins. A wider left-hand margin for titles creates an editorial, premium feel.
*   **Do** use `spacing-12` or `spacing-16` for top-level section padding to ensure the "premium" promise of whitespace.
*   **Do** use `secondary` (emerald) and `tertiary_container` (coral) sparingly as "ink" colors for text, rather than large background blocks.

### Don't:
*   **Don't** use "Card Shadows" on every element. Let the background color do the work.
*   **Don't** use standard 16px padding. It feels "templated." Use the Spacing Scale—try `spacing-5` (1.7rem) for a more intentional look.
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#1B1B21) to maintain the soft, sophisticated high-contrast look.