import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import { styles } from "./home-problems.styles";

type ProblemTone = "participation" | "exclusion" | "skills";

type ProblemCard = Readonly<{
  tone: ProblemTone;
  title: string;
  mascot: Readonly<{
    src: string;
    width: number;
    height: number;
  }>;
}>;

const problemCards = [
  {
    tone: "participation",
    title: "Partisipasi tim tidak merata",
    mascot: {
      src: "/mascots/problem-participation.svg",
      width: 184,
      height: 200,
    },
  },
  {
    tone: "exclusion",
    title: "Terdapat kelompok terbuang",
    mascot: {
      src: "/mascots/problem-exclusion.svg",
      width: 193,
      height: 195,
    },
  },
  {
    tone: "skills",
    title: "Keahlian\ndi tim tidak seimbang",
    mascot: {
      src: "/mascots/problem-skills.svg",
      width: 194,
      height: 193,
    },
  },
] satisfies readonly ProblemCard[];

const toneStyles = {
  participation: styles.participation,
  exclusion: styles.exclusion,
  skills: styles.skills,
} satisfies Record<ProblemTone, stylex.StyleXStyles>;

const mascotStyles = {
  participation: null,
  exclusion: styles.exclusionMascot,
  skills: styles.skillsMascot,
} satisfies Record<ProblemTone, stylex.StyleXStyles | null>;

function ProblemCardItem({ card }: { card: ProblemCard }) {
  return (
    <article
      {...stylex.props(
        styles.card,
        toneStyles[card.tone],
        card.tone === "skills" && styles.finalCard,
      )}
    >
      <h3
        {...stylex.props(
          styles.cardTitle,
          card.tone === "participation" && styles.participationTitle,
        )}
      >
        {card.title}
      </h3>
      <picture>
        <source media="(max-width: 768px)" srcSet={`/mascots/problem-${card.tone}-mobile.png`} />
        <Image
          {...stylex.props(styles.mascot, mascotStyles[card.tone])}
          src={card.mascot.src}
          width={card.mascot.width}
          height={card.mascot.height}
          sizes="(max-width: 767px) 50vw, (max-width: 1100px) 28vw, 18rem"
          alt=""
          loading="eager"
        />
      </picture>
    </article>
  );
}

export function HomeProblems() {
  return (
    <section id="masalah" {...stylex.props(styles.section)} aria-labelledby="problems-title">
      <div {...stylex.props(styles.heading)}>
        <h2 id="problems-title" {...stylex.props(styles.title)}>
          Relate dengan permasalahan ini?
        </h2>
        <p {...stylex.props(styles.intro)}>
          Permasalahan-permasalahan ini pasti sering banget terjadi di perkuliahan kalian
        </p>
      </div>

      <div {...stylex.props(styles.grid)}>
        {problemCards.map((card) => (
          <ProblemCardItem card={card} key={card.tone} />
        ))}
      </div>

      <p {...stylex.props(styles.outcome)}>
        Dengan adanya EquiTeam,
        <br />
        hal-hal tersebut akan teratasi dengan lebih mudah
      </p>
    </section>
  );
}
