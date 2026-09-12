# EduTeams homepage design reference

## Authority

The homepage follows Figma file `Kenj6nx1cHufhh1haMV64Y`, desktop Landing Page `807:26390` and mobile Android Compact `1130:49253`. The linked frames and their local properties override general design-system tokens.

| Section          | Desktop node     | Mobile node  |
| ---------------- | ---------------- | ------------ |
| Hero             | `883:8404`       | `1130:49254` |
| Navigation       | Included in Hero | `1133:37462` |
| What is EquiTeam | `861:9028`       | `1133:37013` |
| Problems         | `861:9026`       | `1133:37083` |

The older Landing Page `271:187` is not a homepage authority. Family is a supporting style reference for whitespace, illustration emphasis, and restrained interface details. The Figma frames above remain authoritative for colors, typography, artwork, and component geometry. Later Solution, Benefits, Call-out, and Footer sections are not implemented.

## Style direction

EquiTeam feels playful and welcoming through its characters, with clear typography and generous space for the content. Family informs the quiet treatment around those characters. Our deep-blue hero, white ground, and softly colored problem cards establish EquiTeam's own identity.

| Family principle                    | EquiTeam adaptation                                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Characters carry the personality    | Use the exported EquiTeam mascots. Keep faces and key poses readable, with the hero trio anchored to the white curve.                                      |
| Generous whitespace                 | Preserve the Figma section spacing and readable text widths. Allow content to grow on narrow screens and with enlarged text.                               |
| Restrained interface details        | Keep surfaces free of added elevation and ornament. Use the Figma borders on controls; About remains unboxed and problem cards retain their gradients.     |
| Calm text around expressive artwork | Use Plus Jakarta Sans for headings and most interface text, with Montserrat for desktop hero supporting copy. Preserve the existing hierarchy and weights. |
| A small set of purposeful accents   | Use `#000098` for the hero and About heading, `#FEC84B` for Keadilan, and the documented green, amber, and violet card treatments.                         |
| Clear primary action                | Preserve the light Google sign-in pill against the blue hero. Its label and icon carry the action without additional decoration.                           |

Family's cream canvas, custom display font, black CTA, orange demo links, and crypto-specific components are not imported into EquiTeam. Its blanket ban on gradients does not apply to the Figma problem cards. Decorative mascot and card colors do not define success, warning, or error states.

For components without a Figma specification, use the existing EquiTeam palette and type hierarchy, generous spacing, and minimal borders. New components require their own responsive and interaction decisions; this reference does not prescribe unimplemented screens.

## Colors and surfaces

| Element                                | Exact treatment                                                        |
| -------------------------------------- | ---------------------------------------------------------------------- |
| Hero background                        | `#000098`                                                              |
| Hero heading and copy                  | `#FFFFFF`                                                              |
| Keadilan highlight                     | `#FEC84B`, not secondary lime                                          |
| Hero curve / About background          | `#FFFFFF`                                                              |
| Google action                          | `#FDFDFD` background, `#000000` label                                  |
| Language control                       | `#FDFDFD` background, `#D5D7DA` border, `#101010` label                |
| About heading / copy                   | `#000098` / `#000000`                                                  |
| Problems background / heading and copy | `#F4F7F9` / `#181D27`                                                  |
| Participation card                     | Gradient `#FDFFFA` at 8.9627% to `#DAFFC5` at 106.03%; title `#054F31` |
| Exclusion card                         | Gradient `#FFFDFA` at 8.9627% to `#FFF6C5` at 106.03%; title `#7A2E0E` |
| Skills card                            | Gradient `#FCFAFF` at 8.9627% to `#CEC5FF` at 106.03%; title `#3E1C96` |

Card gradients are approximately 164.53 degrees on desktop and 167.78 degrees in the mobile frame. About is an unboxed white section. Problems cards have no added outlines or shadows. Lime remains inside exported artwork where the source uses it; it is not a homepage field or heading highlight.

## Typography and layout

Plus Jakarta Sans owns headings, navigation, controls, About, and Problems copy. Desktop hero supporting copy uses Montserrat Medium at 24px; mobile uses Plus Jakarta Sans Regular at 16px/24px.

| Role              | Desktop                            | Mobile                                      |
| ----------------- | ---------------------------------- | ------------------------------------------- |
| Hero heading      | 80px, 800 weight, -4px tracking    | 50px, 700 weight, -2px tracking; four lines |
| About heading     | 82.416px, 800 weight               | 40px, 600 weight, -1.6px tracking           |
| About copy        | 20px, 400 weight, justified        | 16px/24px, 400 weight, left-aligned         |
| Problems heading  | 48px, 800 weight                   | 40px/50px, 600 weight                       |
| Problem title     | 48px, 700 weight, -1.92px tracking | 32px, 700 weight, -1.28px tracking          |
| Closing statement | 28px italic, 500 weight            | 24px/30px italic, 500 weight                |

The dimensions below describe the reference viewports with loaded fonts and default text sizing. Section heights are minimums in the implementation; content growth takes precedence over fixed coordinates.

At 1440px, About begins at y1031 and Problems at y1496. About has two 498px columns separated by 121px. Problems has three 352×389.5px cards with 32px gaps, beginning approximately 245px into the section. Card corners are 9px.

At 412px, the hero is 772px tall. About includes the frame's following white gap and extends to y1344. Problems is 1421px tall, with 290×251px cards beginning 331px into the section and approximately 26.34px vertical gaps. Mobile card corners are approximately 7.408px.

The hero uses the complete three-character illustration. Its image box is about 730×289px on desktop and up to 353×139.5px on compact mobile. Scale it in three ranges: fluid phone sizing through 480px, a 353–432px large-phone/small-tablet range through 768px, then 56vw up to the 730px desktop cap. The current formulas produce a small width step from 432px at 768px to about 430.6px at 769px. Anchor the illustration and curve to the same bottom edge and keep an intentional 21–53px overlap so the characters never float above or separate from the white ground.

Between 769px and 1088px, interpolate the hero height, curve height, and ground overlap together. At up to 896px, About becomes a single readable column and hides the overlapping left mascot. Problems has two columns from 769px through 1088px, with the final card centered, and one column at 768px and below. These pixel equivalents assume the default 16px font size; the layout queries use rem units.

## Referenced assets

All paths below are relative to `public/`. Keep exact exports; do not redraw vector paths.

| Asset                                      | Figma source                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `brand/hero-mark.svg`                      | `807:26489`, mobile counterpart `1133:36968`                               |
| `brand/google.svg`                         | Google instance inside `812:6007`                                          |
| `brand/indonesia.png`                      | Language flag image inside `876:9422`                                      |
| `brand/hero-curve.svg`                     | `807:26393`                                                                |
| `mascots/equiteam-hero-illustration.png`   | Isolated transparent export of `883:8402`; mobile counterpart `1130:49298` |
| `mascots/about-enfj.png`                   | `857:9771`                                                                 |
| `mascots/about-entj.png`                   | `857:9716`; mobile counterpart `1133:37028`                                |
| `mascots/problem-participation.svg`        | `859:8774`                                                                 |
| `mascots/problem-exclusion.svg`            | `859:8617`                                                                 |
| `mascots/problem-skills.svg`               | `859:8380`                                                                 |
| `mascots/problem-participation-mobile.png` | `1133:37089`                                                               |
| `mascots/problem-exclusion-mobile.png`     | `1133:37144`                                                               |
| `mascots/problem-skills-mobile.png`        | `1133:37196`                                                               |

## Accessibility and implementation adaptations

These adaptations preserve the frame's appearance:

- The mobile language pill retains its 28.36px visual height within a 44px hit area.
- Google sign-in and language switching are native disabled buttons until their behavior exists. Do not invent an authentication destination.
- Decorative images use empty alternative text. Headings use one h1, section h2s, and card h3s.
- Preserve the skip link, visible focus treatment, reduced-motion support, and explicit image dimensions.
- All ten rendered homepage images currently use `loading="eager"`, including the About and Problems mascots. This loads them immediately even below the fold. The flag uses a fixed circular wrapper with an aspect-preserving cover crop.
- About copy is left-aligned at 896px and below for readability. This is an intentional adaptation from the mobile frame's justified copy.
- Use fluid layout between the authoritative desktop and mobile widths; do not scale down the whole page.
- Component styling lives in colocated StyleX modules. Keep `globals.css` limited to StyleX output injection and document-level defaults such as the reset, focus ring, and reduced-motion fallback.
- The white 3px seam cover above About prevents a subpixel gap at the hero boundary. It is not decorative elevation.

## Verification

Compare all implemented sections against the two authoritative frames at 1440px and 412px. Also test 320px, 390px, 480px, 768px, 820px iPad Air, 1024px, 1088px, and both sides of every breakpoint. Check heading wraps, local colors, mascot clipping, curve overlap, image loading, section positions, and horizontal overflow. Use browser-control; inspect browser and server warnings. Run `pnpm check`, React Doctor changed scope, and the focused design scan before review.
