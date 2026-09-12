import * as stylex from "@stylexjs/stylex";
const mobile = "@media (max-width: 48rem)";

/** Blue benefit band with equal desktop cards and natural mobile heights. */
export const styles = stylex.create({
  section: {
    paddingBlock: { default: 80, [mobile]: 60 },
    paddingInline: 24,
    backgroundColor: "#000098",
    color: "white",
    fontFamily: "var(--font-plus-jakarta-sans), Arial, sans-serif",
  },
  header: { maxWidth: 675, marginInline: "auto", textAlign: "center" },
  title: {
    margin: 0,
    fontSize: { default: 48, [mobile]: 40 },
    fontWeight: { default: 700, [mobile]: 600 },
    lineHeight: 1.2,
    letterSpacing: "-0.04em",
    textWrap: "balance",
  },
  intro: {
    marginTop: 24,
    marginBottom: 0,
    fontSize: { default: 20, [mobile]: 16 },
    lineHeight: 1.5,
    textWrap: "pretty",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(2, minmax(0, 1fr))", [mobile]: "minmax(0, 1fr)" },
    gap: 32,
    maxWidth: { default: 794, [mobile]: 400 },
    marginInline: "auto",
    marginTop: { default: 64, [mobile]: 40 },
  },
  card: {
    padding: 32,
    borderRadius: 16,
    backgroundImage: "linear-gradient(90deg, #ffffff0d, #ffffff1a)",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#ffffff14",
  },
  iconTile: { width: 100, height: 100, borderRadius: 16, display: "grid", placeItems: "center" },
  icon: { objectFit: "contain", width: 75, height: 75 },
  studentTile: { backgroundColor: "#d1fadf" },
  lecturerTile: { backgroundColor: "#fef0c7" },
  student: { color: "#32d583" },
  lecturer: { color: "#fec84b" },
  cardTitle: { marginTop: 24, marginBottom: 17, fontSize: 24, lineHeight: "32px", fontWeight: 700 },
  list: {
    margin: 0,
    paddingLeft: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontSize: 16,
    lineHeight: 1.5,
  },
  item: { paddingLeft: 2 },
  copy: { color: "white" },
});
