import { Agentation } from "agentation";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { assertDeploymentConfiguration } from "@/lib/deployment-config";
import "../globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EquiTeams",
  description: "A place for teams to work together",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  assertDeploymentConfiguration();

  const { locale } = await params;

  if (!routing.locales.includes(locale as "id" | "en")) {
    notFound();
  }

  const messages = await getMessages();
  const clientMessages = {
    greeting: messages.greeting,
    mahasiswaSubtitle: messages.mahasiswaSubtitle,
    dosenSubtitle: messages.dosenSubtitle,
    answersDefault: messages.answersDefault,
    auth: messages.auth,
    onboarding: messages.onboarding,
    dashboard: messages.dashboard,
    joinClass: messages.joinClass,
  };

  return (
    <html lang={locale}>
      <body className={`${plusJakartaSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={clientMessages}>
          {children}
          <SpeedInsights />
          {process.env.NODE_ENV === "development" && (
            <Agentation endpoint="http://localhost:4747" />
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
