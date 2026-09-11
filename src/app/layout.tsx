// oxlint-disable react-doctor/only-export-components -- Next.js requires metadata exports beside the root layout.
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
