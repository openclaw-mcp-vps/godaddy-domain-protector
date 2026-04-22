import { CheckCircle2, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const planFeatures = [
  "Bulk-check up to 100 domains per request",
  "Rotating provider and egress routes",
  "CSV export for your shortlist workflow",
  "Purchase verification with persistent access cookie",
  "Webhook-backed billing sync"
];

export function PricingCards() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";

  return (
    <Card className="mx-auto w-full max-w-xl border-[var(--brand)]/40 bg-[#111a13]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ShieldCheck className="h-6 w-6 text-[var(--brand-strong)]" />
          Domain Protector Pro
        </CardTitle>
        <CardDescription>Anonymous domain checks for founders and operators who cannot afford registrar sniping.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-4xl font-semibold">$7<span className="text-xl text-[var(--muted)]">/mo</span></p>
          <p className="mt-2 text-sm text-[var(--muted)]">One plan. Unlimited domain sessions. Cancel anytime.</p>
        </div>
        <ul className="space-y-2 text-sm">
          {planFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--brand-strong)]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <a
          href={paymentLink}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Buy Secure Access
        </a>
      </CardFooter>
    </Card>
  );
}
