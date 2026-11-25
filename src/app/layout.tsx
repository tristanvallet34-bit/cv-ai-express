import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./cv.css";
import "./letter.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { SITE } from "@/lib/config";
import { GOOGLE_FONTS_URL } from "@/lib/cv/templates";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Créer un CV professionnel en ligne`, template: `%s | ${SITE.name}` },
  description: "Créez un CV professionnel en 5 minutes : 30 modèles, assistant IA, lettre de motivation, analyse ATS et export PDF.",
  openGraph: { type: "website", siteName: SITE.name, locale: "fr_FR" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#4f46e5", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
      </head>
      <body>
        <Header user={user ? { name: user.name, email: user.email, premium: isPremium(user) } : null} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
