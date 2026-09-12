import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import { styles } from "./home-benefits.styles";

const benefits = [
  {
    title: "Untuk Mahasiswa",
    image: "/brand/student.svg",
    color: styles.student,
    tile: styles.studentTile,
    items: [
      "Pengalaman belajar yang lebih menyenangkan",
      "Kesempatan mengembangkan soft skills",
      "Networking dengan teman yang komplementer",
      "Hasil project yang lebih berkualitas",
    ],
  },
  {
    title: "Untuk Dosen",
    image: "/brand/lecturer.svg",
    color: styles.lecturer,
    tile: styles.lecturerTile,
    items: [
      "Menghemat waktu pembagian kelompok",
      "Mengurangi komplain dari mahasiswa",
      "Hasil pembelajaran yang lebih optimal",
      "Data analisis untuk evaluasi",
    ],
  },
];

function BenefitList({ benefit }: { readonly benefit: (typeof benefits)[number] }) {
  return (
    <ul {...stylex.props(styles.list, benefit.color)}>
      {benefit.items.map((item) => (
        <li key={item} {...stylex.props(styles.item)}>
          <span {...stylex.props(styles.copy)}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BenefitCard({ benefit }: { readonly benefit: (typeof benefits)[number] }) {
  return (
    <article {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.iconTile, benefit.tile)}>
        <Image
          src={benefit.image}
          width={75}
          height={75}
          loading="eager"
          alt=""
          {...stylex.props(styles.icon)}
        />
      </div>
      <h3 {...stylex.props(styles.cardTitle, benefit.color)}>{benefit.title}</h3>
      <BenefitList benefit={benefit} />
    </article>
  );
}

/** Presents student and lecturer benefits as readable, semantic lists. */
export function HomeBenefits() {
  return (
    <section id="manfaat" aria-labelledby="benefits-title" {...stylex.props(styles.section)}>
      <header {...stylex.props(styles.header)}>
        <h2 id="benefits-title" {...stylex.props(styles.title)}>
          Manfaat untuk Semua
        </h2>
        <p {...stylex.props(styles.intro)}>
          EquiTeam memberikan value yang signifikan untuk berbagai stakeholder
        </p>
      </header>
      <div {...stylex.props(styles.grid)}>
        {benefits.map((benefit) => (
          <BenefitCard key={benefit.title} benefit={benefit} />
        ))}
      </div>
    </section>
  );
}
