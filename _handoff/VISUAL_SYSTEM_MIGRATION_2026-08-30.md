# EuroStore visual-system migration — 2026-08-30
## Decision

EuroStore now has one fixed, canonical light identity across customer web, native mobile, admin, helper, and partner applications. The former dark-first black/gold direction is obsolete.

The authoritative source is `_handoff/DESIGN.md`. `_handoff/CODEX_LOCAL_RULES.md` requires every future UI change to follow it even when a prompt does not restate the theme.

## Canonical palette

- Canvas: `#FAF7EF`
- Section: `#F3EEE3`
- Card: `#FFFDF8`
- Elevated: `#FFFFFF`
- Primary text: `#1C1917`
- Secondary text: `#57534E`
- Border: `#E8DCC3`
- Accent: `#B8860B` with pressed state `#9A7209`

Gold is an accent only. Dark surfaces are limited to image overlays, modal scrims, full-screen media viewers, and camera/QR previews.

## Migrated sources

- Shared Tailwind palette and shared Button, Input, Card, and Toast primitives.
- All web-app CSS roots, PWA manifest, newsletter section, and remaining dark Tailwind variants.
- Native mobile token provider, configuration, preferences UI, onboarding, and homepage newsletter.
- Helper and partner layouts, login pages, sidebars, cards, forms, tables, and operational pages.
- Admin primary actions and language control.
- PRD, strategy, Phase 0 checklist, completion reports, and regenerated UI-control inventory.

## Regression prevention

`tests/theme-contract.test.ts` verifies exact tokens, fixed-light mobile configuration, light shared primitives, manifest chrome, and handoff authority. `scripts/audit-ui-controls.mjs` remains the accessibility inventory generator.

## Verification

- 56 Vitest tests passed, including 8 visual-contract assertions.
- TypeScript passed for all applications and packages.
- UI-control audit: 775 controls, 0 issues after fixes.
- Playwright visual inspection completed at 393×852 for storefront, helper login, partner login, and admin login.
