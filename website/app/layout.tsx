import type { Metadata } from "next";
import { Familjen_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-valence-display",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-valence-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Valence | Reflective care, clinically grounded",
  description:
    "Valence helps members and clinicians coordinate reflection, care planning, and privacy-first psychology support."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${familjen.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
