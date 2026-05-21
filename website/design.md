# Design System: My Diary Landing Page

## 1. Visual Theme & Atmosphere

A restrained, gallery-airy interface with confident asymmetric layouts and fluid spring-physics motion. The atmosphere is clinical yet warm — like a well-lit architect's studio with a polished MacOS app running on a pristine display. The page communicates trust, privacy, and craftsmanship through generous whitespace, controlled typographic contrast, and a single accent color that never overwhelms.

- **Density:** 4 — "Gallery Airy" balanced
- **Variance:** 7 — Confident asymmetric, offset layouts
- **Motion:** 6 — Fluid spring physics, staggered cascade reveals

## 2. Color Palette & Roles

- **Canvas White** (`#F9FAFB`) — Primary page background, light mode
- **Pure Surface** (`#FFFFFF`) — Cards, containers, elevated surfaces (light)
- **Zinc-950 Ink** (`#18181B`) — Primary text, headings (light)
- **Zinc-500 Steel** (`#71717A`) — Secondary text, descriptions, labels (light)
- **Zinc-350 Border** (`#D4D4D8`) — Subtle borders, dividers (light)
- **Charcoal Canvas** (`#18181B`) — Primary page background, dark mode
- **Zinc-800 Surface** (`#27272A`) — Cards, containers (dark)
- **Zinc-50 Text** (`#FAFAFA`) — Primary text (dark)
- **Zinc-300 Text** (`#D4D4D8`) — Secondary text (dark)
- **Accent Purple** (`#7F77DD`) — Single accent for CTAs, active states, focus rings. Saturation ~60%. No neon.
- **Accent Soft** (`#EEEDFE`) — Subtle accent tint for hover states, backgrounds
- **Status Red** (`#EF4444`) — Delete actions, destructive buttons
- **Status Green** (`#10B981`) — Success states, mood category indicator

## 3. Typography Rules

- **Display:** `Geist` — Track-tight, weight-driven hierarchy (300/400/500/600). No Inter.
- **Body:** `Geist` — Relaxed leading (1.6), 65ch max-width for readability
- **Mono:** `Geist Mono` — For version numbers, metadata, timestamps
- **Scale:** `clamp(1.5rem, 4vw, 3.5rem)` for hero headline, `clamp(0.875rem, 2vw, 1.125rem)` for body
- **Banned:** Inter, Times New Roman, Georgia, Garamond, Palatino

## 4. Component Stylings

- **Buttons:** Flat, no outer glow. Tactile `-1px` translateY on active. Accent fill for primary (`bg-accent text-white`), ghost/outline for secondary (`border border-zinc-300 text-zinc-700 hover:bg-zinc-100`). Rounded-lg (8px). Downnload buttons: accent fill with external link icon.
- **Cards:** Rounded-xl (12px). No shadow — use subtle `border border-zinc-200/50` instead (cleaner, more MacOS-like). Used only when elevation serves hierarchy.
- **MacOS Window Frame:** Rounded-xl (12px) outer container. Title bar 36px with traffic light dots (`#FF5F57` `#FEBC2E` `#28C840` — exact Apple colors). Title text centered, system font 13px semi-bold.
- **Inputs (find in settings/demo):** Label above, helper text optional, error below. Focus ring in accent color. No floating labels.
- **Loaders:** Subtle opacity pulse on content area. No circular spinners.
- **Empty States (app closed overlay):** Centered illustration (stylized app icon) with "Open My Diary" CTA. Composed, not just text.

## 5. Layout Principles

- **Grid-first:** CSS Grid over Flexbox math. No `calc()` percentage hacks.
- **Hero:** Left-aligned text (45%) + Right MacOS window (55%). Asymmetric split. BANNED: centered hero.
- **Features:** 2x2 zigzag grid. BANNED: 3 equal horizontal cards.
- **Max-width:** 1280px centered container for all section content.
- **Full-height sections:** Use `min-h-[100dvh]`. Never `h-screen` (iOS Safari fix).
- **Spacing:** Vertical section gaps use `clamp(4rem, 10vw, 8rem)`. Section padding: `clamp(2rem, 5vw, 6rem)`.
- **MacOS Window:** Positioned within hero, max-width: 640px, height: 420px, overflow-hidden. Traffic light frame on top. Internal three-pane layout (48px rail + 220px list + flex editor).

## 6. Responsive Rules

- **Mobile (< 768px):** Multi-column collapses to single column. Hero reflows: text above, window below. Features stack vertically.
- **No horizontal scroll:** Critical failure. Overflow hidden on body.
- **Typography scales via `clamp()`:** Headlines `clamp(1.75rem, 6vw, 3.5rem)`. Body minimum `14px`.
- **Touch targets:** All interactive elements minimum `44px` (mobile).
- **MacOS Window on mobile:** Full width, reduced height (320px). Three-pane collapses to single-pane (editor only, entry list hidden).
- **Navigation:** Desktop inline nav collapses to clean mobile hamburger menu.

## 7. Motion & Interaction

- **Spring Physics (default):** `stiffness: 100, damping: 20` — premium, weighty feel. No linear/tween easing.
- **MacOS Window actions:** Close → scale-out to 0 + fade (0.3s spring). Minimize → slide-down to bottom (0.4s spring). Maximize → scale-up to full container width (0.3s spring).
- **Traffic light hover:** Each dot pulses subtly on hover (scale 1.1, 0.2s spring).
- **Entry list items:** Staggered cascade with delay cascade (20ms per item).
- **Mood picker:** Spring scale on select (stiffness 500, damping 15). Dot indicator animates with layoutId-style smooth spring.
- **Dark mode toggle:** Smooth crossfade (0.3s). CSS variables transition `color 0.3s, background-color 0.3s`.
- **Animate only `transform` and `opacity`:** Never `top`, `left`, `width`, `height`.

## 8. Anti-Patterns (BANNED)

- No emojis anywhere (EXCEPT the mood picker — intentional user-facing indicator)
- No `Inter` font family
- No generic serif fonts (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`)
- No pure black (`#000000`) — use Zinc-950 (`#18181B`) instead
- No neon/outer glow shadows
- No oversaturated accents (accent saturation must stay below 80%)
- No excessive gradient text on large headers
- No custom mouse cursors
- No overlapping elements — every element in its own clean spatial zone
- No 3-column equal card grids (use zigzag 2x2 or asymmetric grid)
- No generic placeholder names ("John Doe", "Acme Inc.", "Nexus")
- No fake numbers or fabricated statistics
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionary")
- No filler UI text: "Scroll to explore", "Swipe down", bouncing chevrons, scroll arrows
- No broken Unsplash image links (use `picsum.photos` or inline SVG illustrations)
- No centered Hero sections (for projects with variance > 4)
