import * as stylex from "@stylexjs/stylex";
import { HomeHero } from "./home-hero";
import { HomeProblems } from "./home-problems";
import { styles } from "./page.styles";
import Image from "next/image";

function AboutCopy() {
  return (
    <div {...stylex.props(styles.aboutCopy)}>
      <p {...stylex.props(styles.aboutParagraph)}>
        EquiTeam bukan sekadar alat pembagi kelompok biasa. Kami adalah sebuah platform pintar yang
        dirancang untuk mengakhiri drama “salah tim”.
      </p>
      <p {...stylex.props(styles.aboutParagraph, styles.aboutSecondParagraph)}>
        Dengan bantuan kecerdasan buatan, kami memastikan setiap kelompok memiliki kombinasi anggota
        yang pas, baik dari segi keahlian maupun cara kerja, sehingga semua orang bisa nyaman
        berkontribusi dan meraih hasil terbaik bersama.
      </p>
    </div>
  );
}

function AboutHeading() {
  return (
    <h2 id="about-title" {...stylex.props(styles.aboutHeading)}>
      EquiTeam
      <br />
      itu apa sih?
    </h2>
  );
}

function AboutSection() {
  return (
    <section id="tentang" aria-labelledby="about-title" {...stylex.props(styles.aboutSection)}>
      <div {...stylex.props(styles.aboutCard)}>
        <AboutHeading />
        <AboutCopy />
      </div>
      <Image
        {...stylex.props(styles.aboutMascot, styles.aboutEnfj)}
        src="/mascots/about-enfj.png"
        width={206}
        height={195}
        alt=""
        loading="eager"
      />
      <Image
        {...stylex.props(styles.aboutMascot, styles.aboutEntj)}
        src="/mascots/about-entj.png"
        width={196}
        height={245}
        alt=""
        loading="eager"
      />
    </section>
  );
}

export default function Home() {
  return (
    <>
      <a {...stylex.props(styles.skipLink)} href="#main-content">
        Lewati ke konten utama
      </a>
      <main id="main-content" {...stylex.props(styles.main)}>
        <HomeHero />
        <AboutSection />
        <HomeProblems />
      </main>
    </>
  );
}
