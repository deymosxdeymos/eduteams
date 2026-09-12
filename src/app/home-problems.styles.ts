import * as stylex from "@stylexjs/stylex";

const desktopNarrow = "@media (max-width: 68rem)";
const mobile = "@media (max-width: 48rem)";

export const styles = stylex.create({
  section: {
    minHeight: {
      default: "53.125rem",
      [mobile]: "88.8125rem",
    },
    paddingTop: "4rem",
    paddingRight: "1.5rem",
    paddingBottom: "4rem",
    paddingLeft: "1.5rem",
    backgroundColor: "#f4f7f9",
    scrollMarginTop: "1rem",
    fontFamily: "var(--font-plus-jakarta-sans), Arial, sans-serif",
  },
  heading: {
    maxWidth: {
      default: "56rem",
      [mobile]: "18.875rem",
    },
    marginRight: "auto",
    marginLeft: "auto",
    color: "#181d27",
    textAlign: "center",
  },
  title: {
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    fontSize: {
      default: "3rem",
      [mobile]: "2.5rem",
    },
    fontWeight: {
      default: 800,
      [mobile]: 600,
    },
    lineHeight: {
      default: 1.26,
      [mobile]: 1.25,
    },
    letterSpacing: {
      default: 0,
      [mobile]: "-0.04em",
    },
  },
  intro: {
    marginTop: "1.1875rem",
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    fontSize: {
      default: "1.5rem",
      [mobile]: "1rem",
    },
    fontWeight: 400,
    lineHeight: {
      default: 1.26,
      [mobile]: 1.5,
    },
  },
  grid: {
    display: "grid",
    maxWidth: {
      default: "70rem",
      [desktopNarrow]: "46rem",
      [mobile]: "18.125rem",
    },
    marginTop: {
      default: "4.4375rem",
      [mobile]: "1.625rem",
    },
    marginRight: "auto",
    marginLeft: "auto",
    gap: {
      default: "2rem",
      [mobile]: "1.646rem",
    },
    gridTemplateColumns: {
      default: "repeat(3, minmax(0, 1fr))",
      [desktopNarrow]: "repeat(2, minmax(0, 1fr))",
      [mobile]: "1fr",
    },
  },
  card: {
    position: "relative",
    height: {
      default: "24.34375rem",
      [mobile]: "15.6875rem",
    },
    overflow: "hidden",
    borderRadius: {
      default: "0.5625rem",
      [mobile]: "0.463rem",
    },
  },
  finalCard: {
    width: {
      default: "auto",
      [desktopNarrow]: "calc((100% - 2rem) / 2)",
      [mobile]: "auto",
    },
    gridColumn: {
      default: "auto",
      [desktopNarrow]: "1 / -1",
      [mobile]: "auto",
    },
    justifySelf: {
      default: "auto",
      [desktopNarrow]: "center",
      [mobile]: "stretch",
    },
  },
  participation: {
    backgroundImage: {
      default: "linear-gradient(164.5298deg, #fdfffa 8.9627%, #daffc5 106.03%)",
      [mobile]: "linear-gradient(167.785deg, #fdfffa 8.9627%, #daffc5 106.03%)",
    },
    color: "#054f31",
  },
  exclusion: {
    backgroundImage: {
      default: "linear-gradient(164.5298deg, #fffdfa 8.9627%, #fff6c5 106.03%)",
      [mobile]: "linear-gradient(167.785deg, #fffdfa 8.9627%, #fff6c5 106.03%)",
    },
    color: "#7a2e0e",
  },
  skills: {
    backgroundImage: {
      default: "linear-gradient(164.5298deg, #fcfaff 8.9627%, #cec5ff 106.03%)",
      [mobile]: "linear-gradient(167.785deg, #fcfaff 8.9627%, #cec5ff 106.03%)",
    },
    color: "#3e1c96",
  },
  cardTitle: {
    position: "relative",
    zIndex: 1,
    width: {
      default: "calc(100% - 4.125rem)",
      [mobile]: "12.96rem",
    },
    marginTop: {
      default: "2.375rem",
      [mobile]: "1.955rem",
    },
    marginRight: {
      default: "2.0625rem",
      [mobile]: "2.21rem",
    },
    marginBottom: 0,
    marginLeft: {
      default: "2.0625rem",
      [mobile]: "2.21rem",
    },
    fontSize: {
      default: "3rem",
      [desktopNarrow]: "2.25rem",
      [mobile]: "2rem",
    },
    fontWeight: 700,
    lineHeight: 1.26,
    letterSpacing: "-0.04em",
    whiteSpace: "pre-line",
  },
  participationTitle: {
    width: {
      default: "calc(100% - 4.125rem)",
      [mobile]: "11.125rem",
    },
  },
  mascot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    display: "block",
    width: "auto",
    height: {
      default: "12.5rem",
      [mobile]: "10.8125rem",
    },
    pointerEvents: "none",
    userSelect: "none",
  },
  exclusionMascot: {
    height: {
      default: "12.5rem",
      [mobile]: "10.4375rem",
    },
  },
  skillsMascot: {
    height: {
      default: "12.5rem",
      [mobile]: "10.25rem",
    },
  },
  outcome: {
    maxWidth: {
      default: "44rem",
      [mobile]: "16.0625rem",
    },
    marginTop: {
      default: "4.46875rem",
      [mobile]: "4.394rem",
    },
    marginRight: "auto",
    marginBottom: 0,
    marginLeft: "auto",
    color: "#181d27",
    fontSize: {
      default: "1.75rem",
      [mobile]: "1.5rem",
    },
    fontStyle: "italic",
    fontWeight: 500,
    lineHeight: {
      default: 1.26,
      [mobile]: 1.25,
    },
    textAlign: "center",
  },
});
