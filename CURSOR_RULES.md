# Cursor Rules — Evidencija zaposlenih (UI polish only)

## Objective

Improve the UI to look professional, clean, and consistent.
Use Apple-like system font everywhere.
Keep all behavior and logic identical.

## Non-negotiable constraints

- UI/STYLING ONLY. Do not change app behavior, data flow, or logic.
- Do not edit backend/API/auth/DB/Prisma/docker.
- Do not change request/response shapes, validations, RBAC, or date/time logic.
- No new dependencies unless I explicitly ask.

## Allowed files (you may edit freely)

- src/app/\*\* (pages/layouts/components inside UI routes) — ONLY styling/layout/markup changes
- src/components/\*\* — UI components (Button, Modal, TextField, Navbar, cards, etc.)
- src/app/globals.css (or your global CSS file) — ONLY for font + global styling polish
- public/\*\* (images/icons) — optional, only if needed for UI polish

## Forbidden files (DO NOT TOUCH)

- src/app/api/\*\*
- prisma/\*\*
- src/lib/\*\* (treat as logic)
- docker/\*_, docker-compose._
- Any auth / JWT / guards / RBAC files
- Any server-side routes or scripts

## Working method

- Do the improvements in this order:
  1. Global UI baseline (font, spacing, typography polish)
  2. Navbar + layout spacing
  3. Forms (login/register) styling
  4. Calendar page styling (grid, cards, modal look)
  5. Admin page styling (tables/cards, WFH requests UI)
- Make changes in coherent batches and keep diffs reviewable.

## Reporting (mandatory)

After finishing, provide:

- What you changed (bullet list)
- Which files were modified (list)
- Confirmation that you did not touch forbidden files and did not change logic
