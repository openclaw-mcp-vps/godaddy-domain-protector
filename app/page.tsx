import Link from "next/link";
import { ArrowRight, EyeOff, Radar, ShieldAlert, ShieldCheck } from "lucide-react";

import { PricingCards } from "@/components/pricing-cards";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Why not check domains directly at a registrar?",
    answer:
      "Registrar search pages are one of the easiest places to leak your buying intent. This tool spreads lookups across independent sources so your search pattern is not tied to a single registrar profile."
  },
  {
    question: "How accurate are the availability results?",
    answer:
      "We aggregate RDAP, DNS, and WHOIS mirror responses with confidence scoring. For mission-critical domains, always register immediately after a positive result."
  },
  {
    question: "What happens after I pay?",
    answer:
      "Stripe checkout confirms your payment. Once the webhook is received, you can activate access with the same checkout email and get a persistent secure cookie for dashboard use."
  },
  {
    question: "Who is this best for?",
    answer:
      "Startup founders naming products, domain investors researching batches, and marketing teams validating campaigns before launch." 
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_-10%,#24303f_0%,#0d1117_42%)]">
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-14 md:px-10 md:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-7">
            <p className="inline-flex items-center rounded-full border border-[var(--surface-border)] bg-[#111722] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Domain Research Privacy
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Check domain availability without registrar sniping
            </h1>
            <p className="max-w-2xl text-lg text-[var(--muted)]">
              GoDaddy Domain Protector anonymizes your lookup behavior with rotating providers and egress routes, so you can shortlist names before registrars react to your searches.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/pricing" className={cn(buttonVariants({ size: "lg" }))}>
                Start for $7/mo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Open Dashboard
              </Link>
            </div>
          </div>
          <Card className="border-[#2d3440] bg-[#121821]">
            <CardHeader>
              <CardTitle className="text-xl">What this protects you from</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[var(--muted)]">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-[var(--danger)]" />
                <p>Search monitoring that reveals which names your team values before purchase.</p>
              </div>
              <div className="flex items-start gap-3">
                <EyeOff className="mt-0.5 h-4 w-4 text-amber-300" />
                <p>Single-endpoint lookup trails that can be tied to one account or IP fingerprint.</p>
              </div>
              <div className="flex items-start gap-3">
                <Radar className="mt-0.5 h-4 w-4 text-sky-300" />
                <p>Slow manual checks that delay registration while competitors scan the same space.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y border-[var(--surface-border)] bg-[#101720]">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-14 md:grid-cols-3 md:px-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">The Problem</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted)]">
              Founders often lose high-intent domains after a normal search because registrars and resellers detect demand and price accordingly.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">The Solution</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted)]">
              We route each lookup through rotating providers, queue checks with jitter, and avoid single-registrar fingerprinting.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Who Pays</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--muted)]">
              Startup teams, domain investors, and growth marketers that cannot afford to leak campaign names during research.
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold">Simple pricing, immediate protection</h2>
          <p className="mt-2 text-[var(--muted)]">One plan gives full dashboard access for anonymous bulk checks.</p>
        </div>
        <PricingCards />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
        <div className="mb-8 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[var(--brand-strong)]" />
          <h2 className="text-2xl font-semibold">FAQ</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--muted)]">{faq.answer}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
