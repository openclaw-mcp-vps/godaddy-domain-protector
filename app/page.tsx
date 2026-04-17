import Link from "next/link";

import { PricingCard } from "@/components/pricing-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCheckoutUrl } from "@/lib/lemonsqueezy";

const faqs = [
  {
    q: "How does this reduce registrar sniping risk?",
    a: "Your checks run from server-side workers and optional rotating proxies, so your home or office IP does not repeatedly query domain pages before purchase."
  },
  {
    q: "What makes the availability result reliable?",
    a: "Each domain is checked against DNS, RDAP, and multiple registrar storefront signals, then scored by consensus with confidence percentages."
  },
  {
    q: "How do I unlock after payment?",
    a: "Complete Lemon Squeezy checkout, then redeem with your checkout email and order ID. The app sets a signed HttpOnly cookie to unlock the dashboard."
  }
];

export default function HomePage() {
  const checkoutUrl = buildCheckoutUrl();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-16 md:px-10">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Badge>Domain Acquisition Security</Badge>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Check domain availability without registrar sniping.
          </h1>
          <p className="max-w-xl text-lg text-slate-300">
            GoDaddy Domain Protector runs private multi-registrar checks from controlled infrastructure so you can validate ideas in batch before exposing purchase intent.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Open paid dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#pricing">See pricing</a>
            </Button>
          </div>
        </div>
        <PricingCard checkoutUrl={checkoutUrl} />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="bg-slate-900/75">
          <CardHeader>
            <CardTitle>Problem</CardTitle>
            <CardDescription>Repeated raw searches from one IP can reveal valuable intent before you buy.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/75">
          <CardHeader>
            <CardTitle>Solution</CardTitle>
            <CardDescription>Proxy-aware, concurrent checks across registrar signals with confidence scoring.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-slate-900/75">
          <CardHeader>
            <CardTitle>Outcome</CardTitle>
            <CardDescription>Research names quietly, buy faster, and keep your shortlist private.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <section id="pricing" className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold">Built for founders, SEO teams, and domain investors</h2>
          <p className="text-slate-300">
            Run batch checks before naming reviews, launches, or acquisition sprints. Keep your process private until you are ready to purchase.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Real-time API checks with a protected dashboard</li>
            <li>Webhook-verified payment access with secure cookie auth</li>
            <li>Lean deploy footprint on Next.js 15 App Router</li>
          </ul>
        </div>
        <Card className="bg-slate-900/80">
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((item) => (
              <div key={item.q} className="space-y-1">
                <h3 className="font-medium text-slate-100">{item.q}</h3>
                <p className="text-sm text-slate-400">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
