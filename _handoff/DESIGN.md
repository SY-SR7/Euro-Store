# EuroStore — Canonical Visual Design Contract

> **Status:** authoritative and mandatory for every EuroStore surface.
> This file supersedes every older black/gold, dark-mode, system-theme, or "Aura Elegance" instruction in historical handoff material.

## 1. Non-negotiable direction

EuroStore uses one coherent visual identity across web, native mobile, admin, helper, and partner applications:

- **Light only:** warm ivory surfaces, charcoal text, restrained antique-gold accents.
- **No dark theme or system theme:** do not add a theme switcher, `dark:` variants, dark token maps, or persisted theme preference.
- **No black-and-gold base UI:** gold is an accent for primary actions, selected states, small labels, and subtle rules. It is not paired with black page/card backgrounds.
- **Native mobile parity:** mobile must reproduce the web information architecture and visual language with native controls and interaction patterns—not a WebView or a screenshot of the site.
- **Token first:** new UI must use the semantic tokens below. Hard-coded design colors require a documented functional exception.

The only valid dark surfaces are functional media treatments: image readability overlays, modal scrims, full-screen image/video viewers, and camera/QR previews. Those surfaces must never become the surrounding application theme.

## 2. Canonical tokens

```yaml
color:
  primary: '#B8860B'
  primary-dark: '#9A7209'
  primary-light: '#D4AF37'

  background: '#FAF7EF'
  background-secondary: '#F3EEE3'
  background-card: '#FFFDF8'
  background-elevated: '#FFFFFF'

  text-primary: '#1C1917'
  text-secondary: '#57534E'
  text-muted: '#A8A29E'

  border: '#E8DCC3'
  border-accent: '#D7BE79'

  success: '#15803D'
  warning: '#F59E0B'
  error: '#DC2626'

radius:
  control: 8px
  card: 12px
  panel: 16px
  feature: 24px
  pill: 9999px

shadow:
  card: '0 8px 24px rgba(69, 54, 24, 0.08)'
  elevated: '0 18px 48px rgba(69, 54, 24, 0.12)'
  focus: '0 0 0 3px rgba(184, 134, 11, 0.22)'
```

Canonical RGB tuples for React Native / NativeWind:

```text
primary              184 134 11
primary-dark         154 114 9
primary-light        212 175 55
background           250 247 239
background-secondary 243 238 227
background-card      255 253 248
background-elevated  255 255 255
text-primary         28 25 23
text-secondary       87 83 78
text-muted           168 162 158
border               232 220 195
border-accent        215 190 121
```

## 3. Typography

- **Display / editorial headings:** Playfair Display; Arabic fallback Noto Naskh Arabic.
- **Body and controls:** Manrope; Arabic fallback Noto Naskh Arabic.
- **Utility and numeric data:** Manrope with tabular numerals.
- Headings are sentence-case, compact, and balanced. Avoid decorative all-caps for long text.
- Body copy uses `text-primary` or `text-secondary`; `text-muted` is reserved for supporting metadata.

## 4. Surface hierarchy

1. Page canvas: `background`.
2. Alternating sections and quiet groups: `background-secondary`.
3. Product cards, forms, tables, and sidebars: `background-card`.
4. Popovers and raised controls: `background-elevated`.
5. Borders: `border`; selected or emphasized borders: `border-accent` or `primary`.

Do not create hierarchy by introducing charcoal or black containers. Use spacing, borders, the four light surfaces, type scale, and restrained shadows.

## 5. Component rules

### Buttons

- Primary: `primary` background, `text-primary` text, `primary-dark` hover/pressed.
- Secondary: `background-elevated`, `border`, `text-primary`.
- Tertiary: transparent, `text-secondary`; quiet `background-secondary` hover/pressed.
- Destructive: `error` background or an outlined error treatment.
- Minimum touch target: 44×44 px/pt.
- Every icon-only button has an accessible label and a visible focus/pressed state.

### Inputs

- `background-elevated` surface, `border`, `text-primary`, and `text-muted` placeholder.
- Focus uses `primary` border plus the canonical focus ring.
- Every input has a visible label or an accessible label, a meaningful `name`, and appropriate autocomplete.
- Validation is inline and uses semantic error/success colors.

### Cards and panels

- Cards sit directly on the page or section canvas; avoid nested cards without a real hierarchy.
- Use `card` or `panel` radius and a light border. Shadows are subtle and warm.
- Product imagery remains the visual focus; chrome stays quiet.

### Navigation

- Web header, sidebars, mobile tab bar, and drawers use light card/elevated surfaces.
- Active items use a pale primary tint plus primary text/icon—not a dark block.
- Mobile safe areas and bottom navigation must preserve the light page background.

### Feedback

- Toasts, dialogs, empty states, and errors use light surfaces.
- Modal scrims may be translucent black because they are functional overlays; dialog content remains light.

## 6. Responsive and native behavior

- Design mobile-first and prevent horizontal overflow.
- Use logical start/end spacing so Arabic RTL and English LTR remain equivalent.
- Use native navigation, lists, forms, haptics, safe areas, and performant images in the Expo application.
- Web and native mobile share content, hierarchy, spacing rhythm, colors, and typography intent; platform controls remain native.
- All motion is limited to opacity and transform and respects reduced-motion preferences.

## 7. Prohibited legacy patterns

The following are regressions and must be rejected during review:

- Page, layout, login, sidebar, form, table, toast, or card backgrounds based on `#0F0F0F`, `#111111`, `#121414`, `#151515`, `#1A1A1A`, or `#242424`.
- Legacy brand colors `#C9A84C`, `#A67C2E`, or `#E8D28A` as application tokens.
- `darkMode: 'class'`, `[data-theme="dark"]`, `prefers-color-scheme` theme resolution, or a stored `eurostore_theme` preference.
- Tailwind `dark:` utilities.
- New components that bypass semantic tokens with arbitrary neutral hex values.

Historical reports may mention previous implementations, but they must be clearly marked as obsolete and may not give implementation instructions that conflict with this contract.

## 8. Implementation source map

- Web/admin/helper/partner CSS variables: each app's `src/app/globals.css`.
- Native RGB variables: `apps/mobile/contexts/PreferencesContext.tsx`.
- Shared Tailwind palette: `packages/config/tailwind-config/index.js`.
- Shared primitives: `packages/ui/src/components/`.
- Product and implementation rules: `_handoff/CODEX_LOCAL_RULES.md` and this file.

Any token change must update every source in this map and the theme-contract regression test in the same change.

---

Last updated: 2026-08-30. Replaces the former dark-first “Aura Elegance” specification.
