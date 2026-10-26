import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Student-facing type: rounded, friendly faces for 11-15 year olds.
// Applied only under `.student-theme`; the admin keeps Geist.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plateforme Informatique",
  description: "Plateforme d'apprentissage de l'informatique pour le cycle collégial",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${nunito.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
