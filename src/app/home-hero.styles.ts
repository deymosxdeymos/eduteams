import * as stylex from "@stylexjs/stylex";

const tabletHero = "@media (min-width: 48.0625rem) and (max-width: 68rem)";
const mobile = "@media (max-width: 48rem)";
const compact = "@media (max-width: 30rem)";

/** Hero copy can reflow independently of the decorative artwork. */
export const styles = stylex.create({
  hero: {
    position: "relative",
    minHeight: {
      default: "64.4375rem",
      [tabletHero]: "clamp(54rem, calc(52vw + 29rem), 64.4375rem)",
      [mobile]: "48.25rem",
    },
    overflow: "hidden",
    paddingTop: {
      default: "3.5625rem",
      [mobile]: 0,
    },
    paddingRight: "min(1.5rem, 24px)",
    paddingBottom: 0,
    paddingLeft: "min(1.5rem, 24px)",
    backgroundColor: "#000098",
    isolation: "isolate",
  },
  brand: {
    position: {
      default: "relative",
      [mobile]: "absolute",
    },
    zIndex: 3,
    top: {
      default: "auto",
      [mobile]: "1.3125rem",
    },
    left: {
      default: "auto",
      [mobile]: "10.194%",
    },
    display: "flex",
    width: "fit-content",
    minHeight: {
      default: "4.8125rem",
      [mobile]: "2.153rem",
    },
    marginRight: "auto",
    marginLeft: "auto",
    alignItems: "center",
    gap: {
      default: "0.875rem",
      [mobile]: "0.3125rem",
    },
    color: "#fff",
    fontFamily: "var(--font-plus-jakarta-sans), Arial, sans-serif",
    fontSize: {
      default: "2rem",
      [mobile]: "1rem",
    },
    fontWeight: 450,
    textDecoration: "none",
  },
  brandMark: {
    display: "grid",
    width: {
      default: "5.25rem",
      [mobile]: "2.28rem",
    },
    height: {
      default: "4.8125rem",
      [mobile]: "2.09rem",
    },
    placeItems: "center",
  },
  brandImage: {
    width: {
      default: "3.25rem",
      [mobile]: "1.412rem",
    },
    height: {
      default: "3.5rem",
      [mobile]: "1.52rem",
    },
  },
  brandStrong: {
    fontWeight: 700,
  },
  content: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    maxWidth: "76rem",
    marginRight: "auto",
    marginLeft: "auto",
    paddingTop: {
      default: "4.1875rem",
      [mobile]: "7.25rem",
    },
    paddingBottom: {
      default: "20rem",
      [mobile]: "12rem",
    },
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  heading: {
    maxWidth: {
      default: "min(100%, 70rem)",
      [mobile]: "min(100%, 22.1875rem)",
    },
    minWidth: 0,
    overflowWrap: "anywhere",
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    color: "#fff",
    fontFamily: "var(--font-plus-jakarta-sans), Arial, sans-serif",
    fontSize: {
      default: "clamp(3rem, 6.5vw, 5rem)",
      [mobile]: "clamp(2.625rem, 12.136vw, 3.125rem)",
    },
    fontWeight: {
      default: 800,
      [mobile]: 700,
    },
    letterSpacing: {
      default: "-0.05em",
      [mobile]: "-0.04em",
    },
    lineHeight: {
      default: 1.2625,
      [mobile]: 1.26,
    },
    textWrap: "balance",
  },
  headingHighlight: {
    display: {
      default: "inline",
      [mobile]: "block",
    },
    backgroundColor: "transparent",
    color: "#fec84b",
  },
  headingSecondLine: {
    display: "block",
    marginTop: {
      default: "0.625rem",
      [mobile]: 0,
    },
  },
  description: {
    maxWidth: {
      default: "53.4375rem",
      [mobile]: "19.125rem",
    },
    marginTop: {
      default: "1.25rem",
      [mobile]: "1.6875rem",
    },
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    color: "#fff",
    fontFamily: {
      default: "var(--font-montserrat), Arial, sans-serif",
      [mobile]: "var(--font-plus-jakarta-sans), Arial, sans-serif",
    },
    fontSize: {
      default: "1.5rem",
      [mobile]: "1rem",
    },
    fontWeight: {
      default: 500,
      [mobile]: 400,
    },
    lineHeight: {
      default: 1.208333,
      [mobile]: 1.5,
    },
    textWrap: {
      default: "pretty",
      [mobile]: "initial",
    },
  },
  ctaMotion: {
    display: "inline-flex",
    marginTop: {
      default: "3.25rem",
      [mobile]: "3.375rem",
    },
  },
  cta: {
    display: "inline-flex",
    width: {
      default: "21.375rem",
      [mobile]: "14.408rem",
    },
    height: {
      default: "4.4375rem",
      [mobile]: "2.991rem",
    },
    paddingRight: {
      default: "2rem",
      [mobile]: "1rem",
    },
    paddingLeft: {
      default: "2rem",
      [mobile]: "1rem",
    },
    gap: {
      default: "1.8125rem",
      [mobile]: "1.222rem",
    },
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: "2px",
    borderRightWidth: "2px",
    borderBottomWidth: "2px",
    borderLeftWidth: "2px",
    borderTopStyle: "solid",
    borderRightStyle: "solid",
    borderBottomStyle: "solid",
    borderLeftStyle: "solid",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    borderRadius: "999px",
    backgroundColor: "#fdfdfd",
    color: "#000",
    fontFamily: "var(--font-plus-jakarta-sans), Arial, sans-serif",
    fontSize: {
      default: "1.125rem",
      [mobile]: "0.758rem",
    },
    fontWeight: 500,
    textDecoration: "none",
  },
  ctaImage: {
    width: {
      default: "1.5rem",
      [mobile]: "1.011rem",
    },
    height: {
      default: "1.5rem",
      [mobile]: "1.011rem",
    },
  },
  language: {
    position: "absolute",
    zIndex: 3,
    top: {
      default: "4.0625rem",
      [mobile]: "1rem",
    },
    right: {
      default: "max(2.375rem, calc((100% - 72rem) / 2))",
      [mobile]: "9.22%",
    },
    display: "flex",
    width: {
      default: "6.875rem",
      [mobile]: "3.25rem",
    },
    height: {
      default: "3.75rem",
      [mobile]: "2.75rem",
    },
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: {
      default: "0.4375rem",
      [mobile]: 0,
    },
    paddingRight: {
      default: "0.5rem",
      [mobile]: "0.236rem",
    },
    paddingBottom: {
      default: "0.4375rem",
      [mobile]: 0,
    },
    paddingLeft: {
      default: "0.5rem",
      [mobile]: "0.236rem",
    },
    borderTopWidth: {
      default: "1px",
      [mobile]: 0,
    },
    borderRightWidth: {
      default: "1px",
      [mobile]: 0,
    },
    borderBottomWidth: {
      default: "1px",
      [mobile]: 0,
    },
    borderLeftWidth: {
      default: "1px",
      [mobile]: 0,
    },
    borderTopStyle: "solid",
    borderRightStyle: "solid",
    borderBottomStyle: "solid",
    borderLeftStyle: "solid",
    borderTopColor: "#d5d7da",
    borderRightColor: "#d5d7da",
    borderBottomColor: "#d5d7da",
    borderLeftColor: "#d5d7da",
    borderRadius: "3rem",
    backgroundColor: {
      default: "#fdfdfd",
      [mobile]: "transparent",
    },
    color: "#101010",
    fontFamily: "var(--font-plus-jakarta-sans), Arial, sans-serif",
    fontSize: {
      default: "1.5rem",
      [mobile]: "0.71rem",
    },
    fontWeight: 600,
  },
  languagePill: {
    position: "absolute",
    zIndex: -1,
    top: "0.49rem",
    right: 0,
    bottom: "0.49rem",
    left: 0,
    display: {
      default: "none",
      [mobile]: "block",
    },
    borderTopWidth: "0.5px",
    borderRightWidth: "0.5px",
    borderBottomWidth: "0.5px",
    borderLeftWidth: "0.5px",
    borderTopStyle: "solid",
    borderRightStyle: "solid",
    borderBottomStyle: "solid",
    borderLeftStyle: "solid",
    borderTopColor: "#d5d7da",
    borderRightColor: "#d5d7da",
    borderBottomColor: "#d5d7da",
    borderLeftColor: "#d5d7da",
    borderRadius: "3rem",
    backgroundColor: "#fdfdfd",
  },
  languageFlag: {
    position: "relative",
    flex: "none",
    width: {
      default: "2.9375rem",
      [mobile]: "1.389rem",
    },
    height: {
      default: "2.9375rem",
      [mobile]: "1.389rem",
    },
    overflow: "hidden",
    borderRadius: "50%",
  },
  languageFlagImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  mascot: {
    position: "absolute",
    zIndex: 2,
    right: 0,
    bottom: {
      default: "4.375rem",
      [tabletHero]:
        "calc(clamp(4.25rem, calc(17.55vw - 4.1875rem), 7.75rem) - clamp(2.5625rem, calc(3.76vw + 0.75rem), 3.375rem))",
      [mobile]: "calc(clamp(2.25rem, 9vw, 4.25rem) - clamp(1.375rem, 5.5vw, 2.625rem))",
    },
    left: 0,
    width: {
      default: "min(56vw, 45.625rem)",
      [mobile]: "clamp(22.0625rem, calc(27.5vw + 13.8125rem), 27rem)",
      [compact]: "min(85.68vw, 22.0625rem)",
    },
    marginRight: "auto",
    marginLeft: "auto",
    pointerEvents: "none",
    transformOrigin: "50% 100%",
    userSelect: "none",
  },
  mascotImage: {
    display: "block",
    width: "100%",
    height: "auto",
  },
  curve: {
    position: "absolute",
    zIndex: 1,
    right: 0,
    bottom: "-1px",
    left: 0,
    width: "100%",
    height: {
      default: "7.75rem",
      [tabletHero]: "clamp(4.25rem, calc(17.55vw - 4.1875rem), 7.75rem)",
      [mobile]: "clamp(2.25rem, 9vw, 4.25rem)",
    },
    pointerEvents: "none",
    userSelect: "none",
  },
  curveImage: {
    width: "100%",
    height: "100%",
  },
});
