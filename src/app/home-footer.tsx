import * as stylex from "@stylexjs/stylex";
import Image from "next/image";
import { styles } from "./home-footer.styles";

const socialPlatforms = [
  { name: "Facebook", image: "/brand/facebook.svg" },
  { name: "Twitter", image: "/brand/twitter.svg" },
  { name: "Instagram", image: "/brand/instagram.svg" },
  { name: "LinkedIn", image: "/brand/linkedin.svg" },
];

function FooterContactLinks() {
  return (
    <div {...stylex.props(styles.contactLinks)}>
      <a href="tel:07218030188" {...stylex.props(styles.link)}>
        <Image src="/brand/phone.svg" width={24} height={24} loading="eager" alt="" />
        <span>(0721) 8030188</span>
      </a>
      <a href="mailto:informatika@itera.ac.id" {...stylex.props(styles.link)}>
        <Image src="/brand/mail.svg" width={24} height={24} loading="eager" alt="" />
        <span {...stylex.props(styles.email)}>informatika@itera.ac.id</span>
      </a>
    </div>
  );
}

function FooterAddress() {
  return (
    <div>
      <h3 {...stylex.props(styles.contactTitle)}>Alamat</h3>
      <address {...stylex.props(styles.address)}>
        Ruang D215, Gedung D,
        <br />
        Kampus Itera
      </address>
    </div>
  );
}

function FooterContact() {
  return (
    <div {...stylex.props(styles.contactGrid)}>
      <p {...stylex.props(styles.description)}>
        Platform pintar yang mengakhiri drama “salah tim” di kampus.
        <br />
        Bagi kelompok dengan adil, cepat, dan tanpa ribet.
      </p>
      <FooterAddress />
      <div>
        <h3 {...stylex.props(styles.contactTitle)}>Kontak</h3>
        <FooterContactLinks />
      </div>
    </div>
  );
}

function FooterBrand() {
  return (
    <a href="#main-content" aria-label="EquiTeam, kembali ke atas" {...stylex.props(styles.brand)}>
      <Image src="/brand/footer-logo.svg" width={75} height={81} alt="" loading="eager" />
      <span>
        <strong>Equi</strong>Team
      </span>
    </a>
  );
}

function FooterSocials() {
  return (
    <div aria-label="Media sosial, segera hadir" {...stylex.props(styles.socials)}>
      {socialPlatforms.map((platform) => (
        <button
          key={platform.name}
          type="button"
          disabled
          aria-label={`${platform.name}, segera hadir`}
          title={`${platform.name}, segera hadir`}
          {...stylex.props(styles.social)}
        >
          <Image src={platform.image} width={24} height={24} alt="" loading="eager" />
        </button>
      ))}
    </div>
  );
}

function FooterBottom() {
  return (
    <div {...stylex.props(styles.bottom)}>
      <FooterBrand />
      <p {...stylex.props(styles.copyright)}>
        Copyright © 2025 EquiTeam
        <br />
        Semua hak dilindungi.
      </p>
      <FooterSocials />
    </div>
  );
}

/** Contact links use the supplied destinations; unconfigured social links stay disabled. */
export function HomeFooter() {
  return (
    <footer id="kontak" {...stylex.props(styles.footer)}>
      <Image
        src="/brand/footer-shape.svg"
        width={1046}
        height={1100}
        alt=""
        loading="eager"
        {...stylex.props(styles.backdrop)}
      />
      <div {...stylex.props(styles.inner)}>
        <h2 {...stylex.props(styles.heading)}>LET’S KEEP IN TOUCH</h2>
        <FooterContact />
        <FooterBottom />
      </div>
    </footer>
  );
}
