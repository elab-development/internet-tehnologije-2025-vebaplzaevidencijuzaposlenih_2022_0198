# Design System — Evidencija zaposlenih (UI direction)

## Primary goal

Professional, clean, modern UI with a “native Apple” feel:

- calm spacing
- readable typography
- subtle borders/shadows
- consistent component styling

## Font (must)

Use Apple-like system font stack everywhere:
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
"SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Arial,
"Apple Color Emoji", "Segoe UI Emoji"

## Visual direction

- Prefer a dark, premium look (current vibe), but improve contrast and readability.
- Avoid harsh neon colors; use one clear accent color for primary actions.
- Use consistent corner radius across cards, inputs, buttons (soft, modern).
- Use subtle hover/focus states and smooth transitions (minimal, not flashy).
- Keep layouts grid-based, aligned, and uncluttered.

## Component expectations

Buttons:

- clearly distinguish primary vs secondary vs destructive
- strong focus ring for accessibility
- consistent height/padding

Inputs:

- consistent background + border
- readable placeholder
- error styles that are clear but not loud

Cards/containers:

- consistent padding
- subtle border/shadow separation

Modals:

- clean header, comfortable spacing, clear primary action

Tables/lists:

- row hover, spacing, clear typography
- badges for statuses where relevant (PENDING/APPROVED/REJECTED)

## Do not change behavior

Any improvements must be purely visual. No changes to logic, API calls, RBAC, validation, data flow.
