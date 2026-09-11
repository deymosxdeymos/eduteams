import { HomeHero } from "./home-hero";
import { HomeProblems } from "./home-problems";
import Image from "next/image";

function AboutCopy() {
  return (
    <div className="about-copy">
      <p>
        EquiTeam bukan sekadar alat pembagi kelompok biasa. Kami adalah sebuah platform pintar yang
        dirancang untuk mengakhiri drama “salah tim”.
      </p>
      <p>
        Dengan bantuan kecerdasan buatan, kami memastikan setiap kelompok memiliki kombinasi anggota
        yang pas, baik dari segi keahlian maupun cara kerja, sehingga semua orang bisa nyaman
        berkontribusi dan meraih hasil terbaik bersama.
      </p>
    </div>
  );
}

function AboutHeading() {
  return (
    <h2 id="about-title">
      EquiTeam
      <br />
      itu apa sih?
    </h2>
  );
}

function AboutSection() {
  return (
    <section id="tentang" aria-labelledby="about-title" className="about-section">
      <div className="about-card">
        <AboutHeading />
        <AboutCopy />
      </div>
      <Image className="about-enfj" src="/mascots/about-enfj.png" width={206} height={195} alt="" />
      <Image className="about-entj" src="/mascots/about-entj.png" width={196} height={245} alt="" />
    </section>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Lewati ke konten utama
      </a>
      <main id="main-content" className="overflow-x-clip">
        <HomeHero />
        <AboutSection />
        <HomeProblems />
      </main>
    </>
  );
}
