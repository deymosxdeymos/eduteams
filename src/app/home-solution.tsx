import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import { styles } from "./home-solution.styles";

const steps = [
  {
    title: "Input Data Mahasiswa",
    copy: "Sistem mengumpulkan data personality, skills, preferences, dan gender",
  },
  { title: "Analisis Algoritma", copy: "AI menganalisis kombinasi optimal untuk setiap kelompok" },
  {
    title: "Pembagian Otomatis",
    copy: "Sistem menghasilkan pembagian kelompok yang seimbang dan adil",
  },
];

const aspects = [
  {
    name: "Personality",
    summary: "Base on MBTI",
    title: "Personality Matching",
    copy: "Kombinasi introvert-extrovert, thinking-feeling untuk dinamika yang seimbang",
    color: styles.personalityText,
    tile: styles.personalityTile,
    accent: styles.green,
    image: "/brand/personality.png",
    width: 139,
    height: 149,
    art: styles.personalityArt,
  },
  {
    name: "Skills",
    summary: "Technical & Soft Skills",
    title: "Skill Balancing",
    copy: "Distribusi kemampuan yang merata agar setiap tim memiliki kekuatan yang setara",
    color: styles.skillsText,
    tile: styles.skillsTile,
    accent: styles.yellow,
    image: "/brand/skills.png",
    width: 132,
    height: 152,
    art: styles.skillsArt,
  },
  {
    name: "Gender",
    summary: "Balanced Representation",
    title: "Gender Balance",
    copy: "Representasi yang adil untuk perspektif yang beragam dan inklusif",
    color: styles.genderText,
    tile: styles.genderTile,
    accent: styles.blue,
    image: "/brand/gender.png",
    width: 159,
    height: 118,
    art: styles.genderArt,
  },
];

function ProcessStep({
  step,
  number,
}: {
  readonly step: (typeof steps)[number];
  readonly number: number;
}) {
  return (
    <li {...stylex.props(styles.step)}>
      <span aria-hidden="true" {...stylex.props(styles.number)}>
        {number}
      </span>
      <div>
        <h4 {...stylex.props(styles.stepTitle)}>{step.title}</h4>
        <p {...stylex.props(styles.stepCopy)}>{step.copy}</p>
      </div>
    </li>
  );
}

function ProcessCard() {
  return (
    <div {...stylex.props(styles.process)}>
      <h3 {...stylex.props(styles.cardHeading)}>Bagaimana EquiTeam Bekerja?</h3>
      <ol {...stylex.props(styles.steps)}>
        {steps.map((step, index) => (
          <ProcessStep key={step.title} step={step} number={index + 1} />
        ))}
      </ol>
    </div>
  );
}

function AspectSummaryList() {
  return (
    <dl {...stylex.props(styles.summaryGrid)}>
      {aspects.map((aspect) => (
        <div key={aspect.name} {...stylex.props(styles.summaryTile)}>
          <dt {...stylex.props(styles.aspectName, aspect.accent)}>{aspect.name}</dt>
          <dd {...stylex.props(styles.aspectSummary)}>{aspect.summary}</dd>
        </div>
      ))}
      <div {...stylex.props(styles.summaryTile)}>
        <dt {...stylex.props(styles.aspectName, styles.purple)}>Preferences</dt>
        <dd {...stylex.props(styles.aspectSummary)}>Preferences for task topics</dd>
      </div>
    </dl>
  );
}

function AspectSummary() {
  return (
    <div {...stylex.props(styles.summary)}>
      <div>
        <h3 {...stylex.props(styles.summaryHeading)}>4 Aspek Utama</h3>
        <p {...stylex.props(styles.summaryIntro)}>
          Yang dianalisis untuk pembagian kelompok optimal
        </p>
      </div>
      <AspectSummaryList />
    </div>
  );
}

function AspectIllustration({ aspect }: { readonly aspect: (typeof aspects)[number] }) {
  return (
    <div {...stylex.props(styles.illustration, aspect.tile)}>
      <div {...stylex.props(styles.art, aspect.art)}>
        <Image
          src={aspect.image}
          width={aspect.width}
          height={aspect.height}
          loading="eager"
          alt=""
          {...stylex.props(styles.image, aspect.name === "Personality" && styles.personalityCrop)}
        />
      </div>
    </div>
  );
}

function AspectCard({ aspect }: { readonly aspect: (typeof aspects)[number] }) {
  return (
    <article {...stylex.props(styles.detail)}>
      <AspectIllustration aspect={aspect} />
      <h3 {...stylex.props(styles.detailTitle, aspect.color)}>{aspect.title}</h3>
      <p {...stylex.props(styles.detailCopy)}>{aspect.copy}</p>
    </article>
  );
}

function PreferenceIllustration() {
  return (
    <div {...stylex.props(styles.preferenceArt)}>
      <Image
        src="/brand/preference-box.svg"
        width={123}
        height={121}
        loading="eager"
        alt=""
        {...stylex.props(styles.preferenceBox)}
      />
      <Image
        src="/brand/preference-check.svg"
        width={100}
        height={92}
        loading="eager"
        alt=""
        {...stylex.props(styles.preferenceCheck)}
      />
    </div>
  );
}

function PreferenceCard() {
  return (
    <article {...stylex.props(styles.detail)}>
      <div {...stylex.props(styles.illustration, styles.preferenceTile)}>
        <PreferenceIllustration />
      </div>
      <h3 {...stylex.props(styles.detailTitle, styles.preferenceText)}>Preference Task</h3>
      <p {...stylex.props(styles.detailCopy)}>
        Menyesuaikan ketertarikan mahasiswa terhadap topik tugas yang tersedia
      </p>
    </article>
  );
}

function AspectDetails() {
  return (
    <div {...stylex.props(styles.details)}>
      {aspects.map((aspect) => (
        <AspectCard key={aspect.name} aspect={aspect} />
      ))}
      <PreferenceCard />
    </div>
  );
}

function SolutionContent() {
  return (
    <div {...stylex.props(styles.content)}>
      <div {...stylex.props(styles.topGrid)}>
        <ProcessCard />
        <AspectSummary />
      </div>
      <AspectDetails />
    </div>
  );
}

/** Explains the grouping process and its four inputs without requiring client JavaScript. */
export function HomeSolution() {
  return (
    <section id="solusi" aria-labelledby="solution-title" {...stylex.props(styles.section)}>
      <header {...stylex.props(styles.header)}>
        <h2 id="solution-title" {...stylex.props(styles.title)}>
          Solusi EquiTeam
        </h2>
        <p {...stylex.props(styles.intro)}>
          Sistem cerdas yang membagi kelompok berdasarkan 4 aspek fundamental untuk menciptakan tim
          yang seimbang dan produktif
        </p>
      </header>
      <SolutionContent />
    </section>
  );
}
