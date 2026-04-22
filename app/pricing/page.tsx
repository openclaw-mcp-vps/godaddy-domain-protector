import type { Metadata } from "next";
import Link from "next/link";

import { AccessActivation } from "@/components/access-activation";
import { PricingCards } from "@/components/pricing-cards";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Get anonymous domain checking access for $7/month with Stripe-hosted checkout."
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_80%_-20%,#1b2a37_0%,#0d1117_40%)] px-6 py-14 md:px-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-4">
          <h1 className="text-4xl font-semibold">Pricing & Access</h1>
          <p className="max-w-3xl text-[var(--muted)]">
            Buy once, then activate with your checkout email. The dashboard remains locked until your payment is confirmed by webhook.
          </p>
        </header>

        <PricingCards />

        <AccessActivation />

        <div className="pt-2">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
