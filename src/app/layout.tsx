import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

const fraktionSans = localFont({
  src: [
    {
      path: "../../public/fonts/fraktion/PPFraktionSans-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/fraktion/PPFraktionSans-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-fraktion-sans",
});

const fraktionMono = localFont({
  src: "../../public/fonts/fraktion/PPFraktionMono-Regular.otf",
  display: "swap",
  variable: "--font-fraktion-mono",
  weight: "400",
  style: "normal",
});

export const metadata: Metadata = {
  title: "ATOMA — Matcha",
  description: "Explore matcha from ATOMA.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraktionSans.variable} ${fraktionMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
