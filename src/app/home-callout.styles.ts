import * as stylex from "@stylexjs/stylex";

/** Fluid statement typography avoids Figma's fixed-height text frame. */
export const styles = stylex.create({
  section: {
    paddingBlock: "clamp(4.5rem, 9vw, 8.5rem)",
    paddingInline: "clamp(1.5rem, 5vw, 3rem)",
    color: "#313131",
    textAlign: "center",
    fontFamily: "var(--font-plus-jakarta-sans), Arial, sans-serif",
  },
  title: {
    margin: 0,
    fontSize: "clamp(1.25rem, 2.5vw, 2.25rem)",
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: "-0.04em",
    textWrap: "balance",
  },
  statement: {
    maxWidth: 1087,
    marginInline: "auto",
    marginBlock: "clamp(2.5rem, 5.7vw, 5rem)",
    fontSize: "clamp(2rem, 5vw, 4.5rem)",
    fontWeight: 800,
    fontStyle: "italic",
    lineHeight: 1.369,
    letterSpacing: "-0.05em",
    textWrap: "balance",
  },
  accent: { color: "#000098" },
  closing: {
    margin: 0,
    fontSize: "clamp(1.25rem, 2.2vw, 2rem)",
    fontWeight: 300,
    lineHeight: 1.4,
    letterSpacing: "-0.04em",
  },
});
