import * as stylex from "@stylexjs/stylex";

const tablet = "@media (max-width: 56rem)";
const mobile = "@media (max-width: 48rem)";

export const styles = stylex.create({
  main: {
    overflowX: "clip",
  },
  skipLink: {
    position: "fixed",
    top: "max(0.75rem, env(safe-area-inset-top))",
    left: "max(0.75rem, env(safe-area-inset-left))",
    zIndex: 50,
    minHeight: "2.75rem",
    paddingTop: "0.7rem",
    paddingRight: "1rem",
    paddingBottom: "0.7rem",
    paddingLeft: "1rem",
    borderRadius: "999px",
    backgroundColor: "#fff",
    color: "#181d27",
    fontWeight: 700,
    transform: {
      default: "translateY(-180%)",
      ":focus-visible": "translateY(0)",
    },
  },
  aboutSection: {
    position: "relative",
    minHeight: {
      default: "29.0625rem",
      [tablet]: "auto",
      [mobile]: "35.75rem",
    },
    paddingTop: {
      default: 0,
      [mobile]: "1rem",
    },
    paddingRight: {
      default: "1.5rem",
      [tablet]: "max(2rem, env(safe-area-inset-right))",
      [mobile]: "1.5rem",
    },
    paddingBottom: 0,
    paddingLeft: {
      default: "1.5rem",
      [tablet]: "max(2rem, env(safe-area-inset-left))",
      [mobile]: "1.5rem",
    },
    backgroundColor: "#fff",
    boxShadow: "0 -3px 0 #fff",
    scrollMarginTop: "1rem",
  },
  aboutCard: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    maxWidth: {
      default: "69.8125rem",
      [tablet]: "42rem",
      [mobile]: "18.125rem",
    },
    minHeight: {
      default: "29.0625rem",
      [tablet]: "auto",
      [mobile]: "34.5625rem",
    },
    marginRight: "auto",
    marginLeft: "auto",
    paddingTop: {
      default: 0,
      [tablet]: "6rem",
      [mobile]: 0,
    },
    paddingBottom: {
      default: 0,
      [tablet]: "6rem",
      [mobile]: 0,
    },
    alignContent: "center",
    alignItems: "start",
    gridTemplateColumns: {
      default: "1fr 1fr",
      [tablet]: "1fr",
    },
    gap: {
      default: "7.5625rem",
      "@media (max-width: 68rem)": "3rem",
      [tablet]: "2rem",
      [mobile]: "1rem",
    },
  },
  aboutHeading: {
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    color: "#000098",
    fontFamily: "var(--font-plus-jakarta-sans), Arial, sans-serif",
    fontSize: {
      default: "5.151rem",
      "@media (max-width: 68rem)": "4rem",
      [tablet]: "clamp(3.5rem, 8vw, 4rem)",
      [mobile]: "2.5rem",
    },
    fontWeight: {
      default: 800,
      [mobile]: 600,
    },
    lineHeight: 1.26,
    letterSpacing: {
      default: 0,
      [mobile]: "-0.04em",
    },
  },
  aboutCopy: {
    maxWidth: {
      default: "none",
      [tablet]: "38rem",
    },
    color: "#000",
    fontFamily: "var(--font-plus-jakarta-sans), Arial, sans-serif",
    fontSize: {
      default: "1.25rem",
      [tablet]: "1.125rem",
      [mobile]: "1rem",
    },
    lineHeight: {
      default: 1.26,
      [tablet]: 1.5,
    },
    textAlign: {
      default: "justify",
      [tablet]: "left",
    },
  },
  aboutParagraph: {
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  aboutSecondParagraph: {
    marginTop: {
      default: "2.1875rem",
      [mobile]: "1.5rem",
    },
  },
  aboutMascot: {
    position: "absolute",
    pointerEvents: "none",
  },
  aboutEnfj: {
    top: "-3.75rem",
    left: "max(0px, calc(50% - 39.5rem))",
    display: {
      default: "block",
      [tablet]: "none",
    },
    width: "12.875rem",
    height: "12.1875rem",
  },
  aboutEntj: {
    right: {
      default: "-2.5rem",
      [tablet]: "-1.5rem",
      [mobile]: "-1.875rem",
    },
    bottom: {
      default: "-3rem",
      [tablet]: "-4rem",
      [mobile]: "-4.56rem",
    },
    zIndex: 2,
    width: {
      default: "12.25rem",
      [tablet]: "9.8rem",
      [mobile]: "7.09rem",
    },
    height: {
      default: "15.3125rem",
      [tablet]: "auto",
      [mobile]: "8.83rem",
    },
  },
});
