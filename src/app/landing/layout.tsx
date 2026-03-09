import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/geist/font";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Creator Studio - Create AI Videos, Post Everywhere, Make Money",
  description: "Full-stack AI content creation platform. Generate professional AI avatar videos, post to Instagram/TikTok/YouTube, and sell digital products with integrated payments.",
  keywords: "AI video generator, content creation, Instagram automation, TikTok marketing, YouTube automation, AI avatars, make money online",
  openGraph: {
    title: "AI Creator Studio - Create. Profit. Repeat.",
    description: "Generate AI videos, post to social media, and make money. All in one platform.",
    type: "website",
  },
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
