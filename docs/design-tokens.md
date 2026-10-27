# Design tokens — careerchangefinder.com

Direction: **B v4 · Clear Path (blue)**, approved 26 Oct 2026.
Source of truth for Tahap 4 (Next.js + Tailwind). Mockups: Design canvas "Career Change Finder: Arah Visual", pages "Mockup 1B" and "Mockup 1C".

---

## 1. Colors

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `primary` | `#1D62AF` | Main buttons, links, active states, key-number band | White text on it 6.1:1 · on white 6.1:1 |
| `accent` | `#1D91F1` | Route lines and stops, bars, big decorative numbers | **Not for small text.** Navy `#06172E` on it 5.3:1; white on it 3.3:1 (large text ≥24px bold only) |
| `ink` | `#0E2A4D` | Body text, headings, dark sections, footer | 14.4:1 on white |
| `slate` | `#394662` | Secondary text, inactive nav | 9.4:1 on white |
| `muted` | `#55627A` | Labels, captions, source notes (min 15px) | 6.2:1 on white · 5.9:1 on `ice` |
| `ice` | `#F5FAFD` | Page sections, hero, soft cards | — |
| `mist` | `#E1ECF4` | Borders, dividers, bar tracks, chips | — |
| `sky` | `#CFE6FF` | Highlighter under headline words, light badges, focus ring | Ink on it 11:1 |
| `field-border` | `#8FA4BC` | Input and select borders (non-text 3:1 rule) | 3.0:1 on white |
| `gain` | `#117A58` | Positive pay change | 5.3:1 on white, 4.8:1 on the ice panel |
| `loss` | `#C4242B` | Negative pay change, errors | 5.8:1 on white |
| `white` | `#FFFFFF` | Page background, cards | — |

Rules:
- Pay change: ≥ +3% → `gain`, ≤ −3% → `loss`, otherwise `ink`. Always show the sign (+/−), never color alone.
- Text on `accent` must be `#06172E` or larger than 24px bold.

## 2. Typography

Fonts (Google Fonts, self-hosted with `next/font`):
- **Space Grotesk** 700 (also 500/600 for numbers) — headings, numbers, logo.
- **Manrope** 400 / 500 / 600 / 700 / 800 — body, nav, buttons, labels.

| Token | Desktop | Phone | Font / weight | Line height | Letter spacing |
|---|---|---|---|---|---|
| `h1` | 70px | 40px | Space Grotesk 700 | 1.02 | −0.03em |
| `h2` | 42px | 30px | Space Grotesk 700 | 1.08 | −0.03em |
| `h3` | 22–24px | 20–22px | Space Grotesk 700 | 1.2 | −0.02em |
| `number-xl` | 42px | 34px | Space Grotesk 700 | 1.08 | 0 |
| `number` | 26px | 24px | Space Grotesk 700 | 1.2 | 0 |
| `lead` | 20px | 18px | Manrope 400 | 1.6 | 0 |
| `body` | 18px | 18px | Manrope 400–500 | 1.65 (1.7 in articles) | 0 |
| `ui` (nav, buttons) | 17px | 17px | Manrope 700–800 | 1.2 | 0 |
| `small` (labels, captions) | 15px | 15px | Manrope 500–800 | 1.5 | 0 |

- **Never smaller than 15px.**
- Fluid headings: `h1: clamp(40px, 6vw, 70px)`, `h2: clamp(30px, 4vw, 42px)`.
- Tabular numbers for tables and pay: `font-variant-numeric: tabular-nums`.

## 3. Spacing

Base 4px. Scale: `4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 72, 80, 88, 96`.

- Page gutter: 32px desktop, 16px phone.
- Section gap: 56–88px desktop, 40–48px phone.
- Card padding: 22–30px desktop, 18–22px phone.
- Max content width: 1312px (pages), 760px (article text), 900px (test screens).

## 4. Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 8px | Inline tags |
| `radius-md` | 14–16px | List rows, small cards |
| `radius-lg` | 20–24px | Cards, panels, tables |
| `radius-xl` | 28px | Hero panels, route card, dark callouts |
| `radius-pill` | 999px | Buttons, chips, inputs, badges, search bar |

## 5. Shadows

| Token | Value | Use |
|---|---|---|
| `shadow-sm` | `0 8px 22px rgba(14,42,77,0.12)` | Hover on cards |
| `shadow-md` | `0 2px 4px rgba(14,42,77,0.05), 0 16px 36px rgba(14,42,77,0.12)` | Route card, mega-menu, search panel |
| `shadow-primary` | `0 18px 40px rgba(29,98,175,0.14)` | Hero search bar |
| `focus-ring` | `0 0 0 4px #CFE6FF` + 2px `primary` border | Every focusable element |

No hard offset shadows, no gradient washes.

## 6. Breakpoints

| Name | Min width | Notes |
|---|---|---|
| `sm` | 0 | Phone: one column, hamburger menu, cards replace tables |
| `md` | 761px | Tablet: two columns where it fits |
| `lg` | 1024px | Full nav visible |
| `xl` | 1312px | Max container |

## 7. Components

### Header (all pages)
- Order: **Logo · Nav (centered) · Search icon · "Free Career Test" button**. Height 76px desktop, 74px phone. White, bottom border `mist`. Sticky; shrinks to 64px after scrolling 80px.
- Nav: 17px Manrope 700, `slate`; active item `ink` with 3px `accent` underline. Each item opens a mega-menu.
- **Search is hidden behind an icon** (48px circle, `ice` fill). Click or press `/` → search bar expands across the nav area with type-ahead results (careers, career-change pages) and popular searches. `Esc` closes. Home and listing pages also keep their in-page search.
- CTA label: **"Free Career Test"** (short, keeps the keyword). Hidden on test pages themselves.
- Phone: Logo · search icon · menu button. The CTA moves to the top of the menu drawer and into page heroes.

### Buttons
| Variant | Style |
|---|---|
| Primary | `primary` bg, white text, pill, height 48–58px, 17–18px Manrope 800 |
| Secondary | white bg, 1.5px `mist` border, `ink` text |
| On dark | white bg, `ink` text |
| Hover | primary → `#174F8E`; secondary → border `primary` |
| Disabled | `mist` bg, `muted` text, no shadow |
| Min touch target | 44×44px |

### Inputs and selects
Pill, height 52–58px, 1.5px `field-border`; focus: 2px `primary` + `focus-ring`. Labels always present (visually hidden only if the placeholder repeats them).

### Chips / filters
Pill, 44px min height. Off: white + `mist` border. On: `primary` bg + white text, `aria-pressed="true"`.

### Cards
White, 1.5px `mist` border, `radius-lg`, padding 22–30px. Career card order: route tag · title (h3) · match bar · median pay + pay change · education label.

### Route motif (brand signature)
- Start node: `primary` block, label "You are here".
- Path: 4px dotted `accent` line.
- Stops: `accent` dot with 4px white ring.
- Destinations: white cards with match %, pay, pay change.

### Bars (match, pay, interests)
Height 10–16px, pill, track `mist`, fill `accent` (or `primary` for emphasis).

### Tables
`radius-lg` container with `mist` border; header row `ice`, 15px Manrope 800; rows 18px with `mist` dividers. On phones: cards, or a horizontal scroll box.

### Ad slots
Fixed size to avoid layout shift: 728×90 desktop, 300×250 phone and in articles. Placeholder: 2px dashed `#B9CDE0`, `#FAFCFE` fill, label "Advertisement". Max 1 per screen height.

### Affiliate box
White card inside a `ice` panel, "Sponsored" label on `sky`, link `rel="sponsored nofollow"`, disclosure line in `small`.

### Data notes
Every page with numbers ends with a source line in `small`/`muted`. Match scores labeled "Our estimate" with a Methodology link. Group wages: "Pay shown for the broader BLS group: [title]".

## 8. Tailwind config (Tahap 4)

```js
// tailwind.config.js (extend)
colors: {
  primary: '#1D62AF', accent: '#1D91F1', ink: '#0E2A4D', slate: '#394662',
  muted: '#55627A', ice: '#F5FAFD', mist: '#E1ECF4', sky: '#CFE6FF',
  field: '#8FA4BC', gain: '#117A58', loss: '#C4242B'
},
fontFamily: {
  display: ['var(--font-space-grotesk)', 'Helvetica', 'sans-serif'],
  sans: ['var(--font-manrope)', 'Helvetica', 'Arial', 'sans-serif']
},
fontSize: {
  h1: ['clamp(40px,6vw,70px)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
  h2: ['clamp(30px,4vw,42px)', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
  h3: ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
  lead: ['20px', { lineHeight: '1.6' }],
  body: ['18px', { lineHeight: '1.65' }],
  ui: ['17px', { lineHeight: '1.2' }],
  small: ['15px', { lineHeight: '1.5' }]
},
borderRadius: { sm: '8px', md: '16px', lg: '24px', xl: '28px' },
boxShadow: {
  sm: '0 8px 22px rgba(14,42,77,0.12)',
  md: '0 2px 4px rgba(14,42,77,0.05), 0 16px 36px rgba(14,42,77,0.12)',
  primary: '0 18px 40px rgba(29,98,175,0.14)',
  focus: '0 0 0 4px #CFE6FF'
},
screens: { md: '761px', lg: '1024px', xl: '1312px' },
maxWidth: { page: '1312px', article: '760px', test: '900px' }
```

## 9. Accessibility checklist

- Text contrast ≥ 4.5:1 (checked above); UI borders ≥ 3:1.
- Visible focus ring on every link, button and input.
- Real `<button>`, `<a href>`, `<label>`; icon-only buttons have `aria-label`.
- Never color alone: pay change has +/− signs; selected chips have a check mark.
- Respect `prefers-reduced-motion` for header shrink and search animation.
