import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valence App",
  description: "The Valence psychology platform app"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
