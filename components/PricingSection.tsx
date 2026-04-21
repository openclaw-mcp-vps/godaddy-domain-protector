import { CheckCheck, Lock, Radar, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PricingSectionProps {
  paymentLink: string;
}

const features = [
  "Unlimited anonymous domain checks",
  "Rotating proxy route selection",
  "WHOIS + RDAP cross-verification",
  "Real-time risk signals and confidence scoring",
  "Rate-limit protection against scraping",
];

export function PricingSection({ paymentLink }: PricingSectionProps) {
  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl px-6 pb-24">
      <Card className="overflow-hidden">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8ea5c4]">Simple Pricing</p>
            <h2 className="mt-3 text-3xl font-bold text-[#f6faff] sm:text-4xl">
              Protect domain ideas for less than one lost domain
            </h2>
            <p className="mt-4 max-w-2xl text-base text-[#b2c4dc]">
              Domain sniping can cost founders thousands. For $7/month, every lookup runs behind privacy-aware
              infrastructure designed to hide your buying intent.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#2a3b54] bg-[#111b2a] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#dfe9f7]">
                  <ShieldCheck className="size-4 text-[#7eb0ff]" />
                  Privacy-first routing
                </p>
                <p className="mt-1 text-sm text-[#9cb0cc]">Distributed egress to avoid repetitive lookup fingerprints.</p>
              </div>
              <div className="rounded-lg border border-[#2a3b54] bg-[#111b2a] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#dfe9f7]">
                  <Radar className="size-4 text-[#7eb0ff]" />
                  Fast checks
                </p>
                <p className="mt-1 text-sm text-[#9cb0cc]">Most results return in under 3 seconds with confidence scoring.</p>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-[#d0dced]">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCheck className="mt-0.5 size-4 text-[#8dd4a3]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#304361] bg-[#0f1826] p-6">
            <p className="text-xs uppercase tracking-[0.17em] text-[#89a4c8]">Starter Plan</p>
            <p className="mt-3 text-5xl font-bold text-[#f7fbff]">
              $7
              <span className="ml-1 text-base font-medium text-[#9ab0cc]">/mo</span>
            </p>
            <p className="mt-3 text-sm text-[#b1c4db]">
              Designed for founders, investors, and marketing teams evaluating domain options before launch.
            </p>

            <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="mt-6 block">
              <Button size="lg" className="w-full">
                <Lock className="mr-2 size-4" />
                Buy Secure Access
              </Button>
            </a>

            <p className="mt-3 text-xs text-[#89a0be]">
              Hosted Stripe checkout. After payment, return here and unlock with your payment email.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
