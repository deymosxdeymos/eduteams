// oxlint-disable react-doctor/only-export-components -- Next.js requires metadata exports beside the root layout.
import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EquiTeam | Tim yang adil, hasil yang unggul",
  description: "EquiTeam membantu dosen membentuk kelompok belajar yang adil dan seimbang.",
};

export const viewport: Viewport = {
  themeColor: "#000098",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${plusJakartaSans.variable} ${montserrat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
