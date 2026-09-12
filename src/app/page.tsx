import { HomeHero } from "./home-hero";

function AboutCopy() {
  return (
    <div className="about-copy">
      <h2 id="about-title">Apa itu EquiTeam?</h2>
      <p>
        EquiTeam membantu dosen membentuk kelompok belajar yang adil dan seimbang berdasarkan
        kepribadian, keterampilan, dan preferensi tugas setiap mahasiswa.
      </p>
    </div>
  );
}

function AboutSection() {
  return (
    <section id="tentang" aria-labelledby="about-title" className="about-section">
      <div className="about-card">
        <AboutCopy />
        <span className="about-question" aria-hidden="true">
          ?
        </span>
      </div>
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
      </main>
    </>
  );
}
