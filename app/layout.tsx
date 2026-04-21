import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const baseUrl = "https://godaddy-domain-protector.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GoDaddy Domain Protector | Anonymous Domain Availability Checks",
    template: "%s | GoDaddy Domain Protector",
  },
  description:
    "Check domain availability through rotating proxy lookups so registrars cannot track and snipe your best domain ideas.",
  keywords: [
    "domain availability checker",
    "anonymous WHOIS lookup",
    "domain sniping prevention",
    "startup domain research",
    "domain intelligence",
  ],
  openGraph: {
    type: "website",
    url: baseUrl,
    title: "GoDaddy Domain Protector",
    description:
      "Anonymous domain checks through rotating proxy infrastructure to prevent registrar sniping.",
    siteName: "GoDaddy Domain Protector",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoDaddy Domain Protector",
    description:
      "Check domain availability anonymously and stop registrars from preempting your search intent.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
