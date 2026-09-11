import Image from "next/image";

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

function ProblemCardItem({ card }: { card: ProblemCard }) {
  return (
    <article className="problem-card" data-tone={card.tone}>
      <h3>{card.title}</h3>
      <picture>
        <source media="(max-width: 768px)" srcSet={`/mascots/problem-${card.tone}-mobile.png`} />
        <Image
          className="problem-mascot"
          src={card.mascot.src}
          width={card.mascot.width}
          height={card.mascot.height}
          sizes="(max-width: 767px) 50vw, (max-width: 1100px) 28vw, 18rem"
          alt=""
        />
      </picture>
    </article>
  );
}

export function HomeProblems() {
  return (
    <section id="masalah" className="problems-section" aria-labelledby="problems-title">
      <div className="problems-heading">
        <h2 id="problems-title">Relate dengan permasalahan ini?</h2>
        <p className="problems-intro">
          Permasalahan-permasalahan ini pasti sering banget terjadi di perkuliahan kalian
        </p>
      </div>

      <div className="problems-grid">
        {problemCards.map((card) => (
          <ProblemCardItem card={card} key={card.tone} />
        ))}
      </div>

      <p className="problems-outcome">
        Dengan adanya EquiTeam,
        <br />
        hal-hal tersebut akan teratasi dengan lebih mudah
      </p>
    </section>
  );
}
