import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart-drawer";
import { OriginsProvider } from "@/components/origins-provider";
import { SmoothScrollProvider } from "@/components/smooth-scroll";
import { StorefrontThemeProvider } from "@/components/storefront-theme-provider";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./storefront-themes.css";

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

const atomaMono = localFont({
  src: [
    {
      path: "../../public/fonts/ibm-plex-mono/IBMPlexMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/ibm-plex-mono/IBMPlexMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-atoma-mono",
  fallback: ["Courier New"],
});

const antroVectra = localFont({
  src: "../../public/fonts/antro-vectra/Antro_Vectra.otf",
  display: "swap",
  variable: "--font-antro-vectra",
  weight: "400",
  style: "normal",
  preload: false,
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://atoma-updated.vercel.app"),
  title: "ATOMA — Matcha",
  description:
    "Matcha, clearly defined. A selection organised by profile, format and application, with precise specifications to guide your choice.",
  openGraph: {
    type: "website",
    siteName: "ATOMA",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const preference = (await cookies()).get("atoma-theme")?.value;
  const initialTone = preference === "dark" ? "dark" : "light";
  return (
    <html
      lang="en"
      className={`${fraktionSans.variable} ${fraktionMono.variable} ${atomaMono.variable} ${antroVectra.variable}`}
    >
      <body>
        <SmoothScrollProvider>
          <StorefrontThemeProvider initialTone={initialTone}>
            <CartProvider>
              <OriginsProvider>{children}</OriginsProvider>
            </CartProvider>
          </StorefrontThemeProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
