import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valence",
  description: "A psychology platform for reflective care"
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
