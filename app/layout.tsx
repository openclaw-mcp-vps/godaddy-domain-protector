import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://godaddy-domain-protector.com"),
  title: "GoDaddy Domain Protector | Check availability without registrar sniping",
  description:
    "Check domain availability across multiple registrars simultaneously while masking your intent with server-side checks and rotating proxies.",
  openGraph: {
    title: "GoDaddy Domain Protector",
    description:
      "Check domain availability across registrars without exposing your search behavior from your own IP.",
    type: "website",
    url: "https://godaddy-domain-protector.com"
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0d1117] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
