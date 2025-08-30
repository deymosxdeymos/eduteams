MBTI Mascot SVG Normalization

- Goal: Ensure all MBTI mascot heads render the same visual size and align consistently above bars and in avatars.
- Approach: Preprocess the raw SVG files to tightly crop transparent padding and standardize their `viewBox`.

Commands
- Normalize assets: `bun run assets:normalize-mbti`

Details
- Input: `public/mbti-logo/*.svg`
- Output: `public/mbti-logo-normalized/*.svg`
- The script renders each SVG at high resolution, detects non-transparent bounds, then rewrites the file:
  - Removes explicit `width`/`height` attributes
  - Sets a tight `viewBox="0 0 W H"`
  - Wraps original content with `<g transform="translate(-minX,-minY)">` to recenter
  - Adds `preserveAspectRatio="xMidYMid meet"` on root to avoid cropping

Usage in UI
- Charts and components now reference `/mbti-logo-normalized/<TYPE>.svg` for consistent appearance.

Notes
- If you replace or add raw logos in `public/mbti-logo`, re-run the normalization command.
- For rare outliers, you can tweak the `MASCOT_TWEAKS` map (and the `MASCOT_DEFAULT` offsets) in `src/components/dashboard/assignment-content.tsx` as a last-mile adjustment.
