import type { Metadata, Viewport } from "next";
import { Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";

const valenceSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-valence-sans",
  weight: ["400", "500", "600", "700", "800", "900", "1000"],
  display: "swap"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-valence-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Valence App | Product shell",
  description: "The authenticated Valence psychology platform app"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${valenceSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
