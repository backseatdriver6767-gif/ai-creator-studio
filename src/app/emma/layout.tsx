import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { artist } from "./site";
import "./emma.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${artist.wordmark} — Art`,
  description: artist.tagline,
  openGraph: {
    title: artist.wordmark,
    description: artist.tagline,
    type: "website",
  },
};

export default function EmmaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable}`}>
      <body className="emma-root antialiased">{children}</body>
    </html>
  );
}
