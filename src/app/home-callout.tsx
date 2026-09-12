import * as stylex from "@stylexjs/stylex";
import { styles } from "./home-callout.styles";

/** Closing statement stays readable at narrow widths and with reduced motion. */
export function HomeCallout() {
  return (
    <section aria-labelledby="fairness-title" {...stylex.props(styles.section)}>
      <h2 id="fairness-title" {...stylex.props(styles.title)}>
        Fokus pada Keadilan dan Keseimbangan
      </h2>
      <p {...stylex.props(styles.statement)}>
        <span {...stylex.props(styles.accent)}>EquiTeam</span> membuka gerbang kesempatan yang{" "}
        <span {...stylex.props(styles.accent)}>adil</span>
        {"\u00a0"}
        <span aria-hidden="true">👍</span>, kami melepaskan potensi penuh setiap mahasiswa untuk
        meraih <span {...stylex.props(styles.accent)}>kesuksesan</span>
        {"\u00a0"}
        <span aria-hidden="true">⭐</span>
      </p>
      <p {...stylex.props(styles.closing)}>Keadilan bukan lagi impian</p>
    </section>
  );
}
