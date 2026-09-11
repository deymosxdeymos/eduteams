# EduTeams homepage design reference

## Authority

The homepage follows Figma file `Kenj6nx1cHufhh1haMV64Y`, desktop Landing Page `807:26390` and mobile Android Compact `1130:49253`. The linked frames and their local properties override general design-system tokens.

| Section          | Desktop node     | Mobile node  |
| ---------------- | ---------------- | ------------ |
| Hero             | `883:8404`       | `1130:49254` |
| Navigation       | Included in Hero | `1133:37462` |
| What is EquiTeam | `861:9028`       | `1133:37013` |
| Problems         | `861:9026`       | `1133:37083` |

The older Landing Page `271:187` and Family reference are not homepage authorities. Their cream surfaces, lime transition, purple logo, scientist-only hero, white cards, and inset outlines do not apply to these frames. Later Solution, Benefits, Call-out, and Footer sections are not implemented.

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
| About copy        | 20px, 400 weight, justified        | 16px/24px, 400 weight, justified            |
| Problems heading  | 48px, 800 weight                   | 40px/50px, 600 weight                       |
| Problem title     | 48px, 700 weight, -1.92px tracking | 32px, 700 weight, -1.28px tracking          |
| Closing statement | 28px italic, 500 weight            | 24px/30px italic, 500 weight                |

At 1440px, About begins at y1031 and Problems at y1496. About has two 498px columns separated by 121px. Problems has three 352×389.5px cards with 32px gaps, beginning 245px into the section. Card corners are 9px.

At 412px, the hero is 772px tall. About includes the frame's following white gap and extends to y1344. Problems is 1421px tall, with 290×251px cards beginning 331px into the section and approximately 26.34px vertical gaps. Mobile card corners are approximately 7.408px.

The hero uses the complete three-character illustration. Its exported visible footprint is about 730×289px on desktop and up to 353×139.5px on compact mobile. Scale it in three continuous ranges: fluid phone sizing through 480px, a 353–432px large-phone/small-tablet range through 768px, then 56vw up to the 730px desktop cap. Anchor the illustration and curve to the same bottom edge and keep an intentional 21–53px overlap so the characters never float above or separate from the white ground.

Between 769px and 1088px, interpolate the hero height, curve height, and ground overlap together. At up to 896px, About becomes a single readable column and hides the overlapping left mascot. Problems becomes a two-column grid below 1088px and a single column below 768px.

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
- Load above-the-fold images promptly. The flag uses a fixed circular wrapper with an aspect-preserving cover crop and eager loading.
- Use fluid layout between the authoritative desktop and mobile widths; do not scale down the whole page.
- Component styling lives in colocated StyleX modules. Keep `globals.css` limited to StyleX output injection and document-level defaults such as the reset, focus ring, and reduced-motion fallback.

## Verification

Compare all implemented sections against the two authoritative frames at 1440px and 412px. Also test 320px, 390px, 480px, 768px, 820px iPad Air, 1024px, 1088px, and both sides of every breakpoint. Check heading wraps, local colors, mascot clipping, curve overlap, image loading, section positions, and horizontal overflow. Use browser-control; inspect browser and server warnings. Run `pnpm check`, React Doctor changed scope, and the focused design scan before review.
