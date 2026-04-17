"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const redeemSchema = z.object({
  email: z.string().email("Enter the same email used at checkout."),
  orderId: z.string().min(3, "Order ID is required.")
});

type RedeemValues = z.infer<typeof redeemSchema>;

type PricingCardProps = {
  checkoutUrl: string | null;
};

declare global {
  interface Window {
    LemonSqueezy?: {
      Url?: {
        Open: (url: string) => void;
      };
    };
  }
}

export function PricingCard({ checkoutUrl }: PricingCardProps) {
  const [redeemMessage, setRedeemMessage] = useState<string>("");

  const form = useForm<RedeemValues>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      email: "",
      orderId: ""
    }
  });

  async function redeemAccess(values: RedeemValues) {
    setRedeemMessage("");

    const response = await fetch("/api/redeem-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const payload = await response.json();

    if (!response.ok) {
      setRedeemMessage(payload.error || "Unable to redeem access yet.");
      return;
    }

    setRedeemMessage("Access activated. Redirecting to dashboard...");
    window.location.href = "/dashboard";
  }

  function openCheckout() {
    if (!checkoutUrl) {
      setRedeemMessage("Lemon Squeezy store is not configured yet.");
      return;
    }

    if (window.LemonSqueezy?.Url?.Open) {
      window.LemonSqueezy.Url.Open(checkoutUrl);
      return;
    }

    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
      <Card className="border-emerald-700/40 bg-slate-900/90">
        <CardHeader>
          <CardTitle className="text-3xl">$7 / month</CardTitle>
          <CardDescription>
            Continuous private checks, registrar consensus scoring, and instant unlock to the checker dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Batch checks up to 50 domains per request</li>
            <li>DNS + RDAP + registrar storefront consensus</li>
            <li>Proxy rotation support through `PROXY_POOL`</li>
            <li>Lemon Squeezy payment and webhook verification</li>
          </ul>
          <Button className="w-full" onClick={openCheckout} type="button">
            Start protected checks
          </Button>
          <form onSubmit={form.handleSubmit(redeemAccess)} className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm font-medium">Already purchased? Unlock your access</p>
            <Input placeholder="Checkout email" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-xs text-rose-300">{form.formState.errors.email.message}</p>}
            <Input placeholder="Order ID (for example 123456)" {...form.register("orderId")} />
            {form.formState.errors.orderId && <p className="text-xs text-rose-300">{form.formState.errors.orderId.message}</p>}
            <Button className="w-full" type="submit" variant="outline" disabled={form.formState.isSubmitting}>
              Redeem access cookie
            </Button>
            {redeemMessage && <p className="text-xs text-slate-300">{redeemMessage}</p>}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
