import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://godaddy-domain-protector.vercel.app"),
  title: {
    default: "GoDaddy Domain Protector",
    template: "%s | GoDaddy Domain Protector"
  },
  description:
    "Check domain availability anonymously using rotating lookup routes so registrars cannot weaponize your search intent.",
  openGraph: {
    title: "GoDaddy Domain Protector",
    description:
      "Anonymous domain availability checks with rotating providers and egress routes to reduce registrar sniping risk.",
    type: "website",
    url: "https://godaddy-domain-protector.vercel.app",
    siteName: "GoDaddy Domain Protector"
  },
  twitter: {
    card: "summary_large_image",
    title: "GoDaddy Domain Protector",
    description: "Protect domain research from registrar sniping with anonymous lookup routing."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} bg-[var(--background)] text-[var(--foreground)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
