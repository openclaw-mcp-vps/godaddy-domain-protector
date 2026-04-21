import Link from "next/link";
import { ArrowRight, EyeOff, Globe2, LockKeyhole, ServerCog, TriangleAlert } from "lucide-react";

import { AccessClaimForm } from "@/components/AccessClaimForm";
import { PricingSection } from "@/components/PricingSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const faqEntries = [
  {
    question: "How does this reduce registrar sniping risk?",
    answer:
      "Instead of repeating domain checks from one IP, lookups are distributed across rotating routes and proxy exits. This breaks the obvious intent pattern that can expose high-value domains.",
  },
  {
    question: "Do I get direct registrar integration?",
    answer:
      "This product is intentionally lookup-only. You can verify availability anonymously, then register privately with your preferred registrar workflow.",
  },
  {
    question: "How do I unlock access after paying?",
    answer:
      "Use the same email from Stripe checkout in the unlock form. Once payment is recognized, a secure cookie is issued and the checker is immediately available.",
  },
  {
    question: "Is this useful for teams?",
    answer:
      "Yes. Startup teams and domain investors use it to test naming options without signaling intent before they are ready to buy.",
  },
];

const steps = [
  {
    title: "Submit domain",
    description: "Enter any root domain you want to evaluate, such as launchvector.com.",
    icon: Globe2,
  },
  {
    title: "Anonymized routing",
    description: "The request is queued and sent through a rotating egress endpoint.",
    icon: ServerCog,
  },
  {
    title: "WHOIS + RDAP verdict",
    description: "Response includes availability, confidence, route metadata, and registration signals.",
    icon: LockKeyhole,
  },
];

export default function HomePage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";

  return (
    <main className="min-h-screen bg-transparent text-[#e6edf3]">
      <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-14 md:pt-20">
        <p className="inline-flex rounded-full border border-[#2f4261] bg-[#0f1a2a] px-4 py-1 text-xs uppercase tracking-[0.2em] text-[#8aa6cc]">
          Domain Research Privacy
        </p>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-[#f5f9ff] md:text-6xl">
              Check domain availability without registrar sniping
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-[#b8c8de]">
              GoDaddy Domain Protector runs anonymous domain checks through rotating routes so registrars cannot
              profile your interest and preempt your best names.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg">Start Protecting Domain Searches</Button>
              </a>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>

            <p className="mt-4 max-w-xl text-sm text-[#98afcd]">
              Entrepreneurs lose ideal domains every week after a public lookup. This tool minimizes that exposure.
            </p>

            <AccessClaimForm />
          </div>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 text-[#ffb9c8]" />
              <div>
                <p className="text-sm font-semibold text-[#f8d6de]">The expensive pattern</p>
                <p className="mt-2 text-sm text-[#e9c2cc]">
                  1. Search domain publicly.
                  <br />
                  2. Wait a day.
                  <br />
                  3. Domain appears as “premium” or unavailable.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-[#2d3f5b] bg-[#101b2b] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#d7e4f6]">
                <EyeOff className="size-4 text-[#7fb1ff]" />
                What changes with this tool
              </p>
              <p className="mt-2 text-sm text-[#abc0dc]">
                Each lookup route is randomized and rate-limited. You get the signal you need while reducing direct
                intent leakage from repeated registrar-facing queries.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title} className="p-5">
              <step.icon className="size-5 text-[#79acff]" />
              <h2 className="mt-3 text-xl font-semibold text-[#f0f6ff]">{step.title}</h2>
              <p className="mt-2 text-sm text-[#aec1dc]">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <PricingSection paymentLink={paymentLink} />

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <h2 className="text-3xl font-bold text-[#f3f8ff]">Frequently asked questions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faqEntries.map((entry) => (
            <Card key={entry.question} className="p-5">
              <h3 className="text-lg font-semibold text-[#f1f7ff]">{entry.question}</h3>
              <p className="mt-2 text-sm text-[#afc2de]">{entry.answer}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
