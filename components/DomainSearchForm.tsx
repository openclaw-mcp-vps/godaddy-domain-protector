"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DomainResults } from "@/components/DomainResults";
import type { DomainLookupResponse, DomainCheckError } from "@/lib/types";

const domainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?=.{3,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/,
      "Enter a valid domain (example: usebeam.ai)",
    ),
});

type DomainFormValues = z.infer<typeof domainSchema>;

export function DomainSearchForm() {
  const [result, setResult] = useState<DomainLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DomainFormValues>({
    resolver: zodResolver(domainSchema),
    defaultValues: {
      domain: "",
    },
  });

  const onSubmit = async (values: DomainFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/domain-check", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = (await response.json()) as DomainCheckError;
        throw new Error(body.error || "Domain check failed");
      }

      const body = (await response.json()) as DomainLookupResponse;
      setResult(body);
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : "Unexpected request error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-xl border border-[#2a3c55] bg-[#101a29]/90 p-5">
        <div className="mb-4 flex items-start gap-3">
          <Shield className="mt-0.5 size-5 text-[#7eb0ff]" />
          <p className="text-sm text-[#afc1d9]">
            Every check runs through rotating routes so registrars can’t build a profile from repeated lookups.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input {...register("domain")} placeholder="example.com" autoComplete="off" spellCheck={false} />
            <Button type="submit" size="lg" className="sm:w-auto" disabled={loading}>
              <Search className="mr-2 size-4" />
              {loading ? "Checking..." : "Check Domain"}
            </Button>
          </div>

          {errors.domain ? <p className="text-sm text-[#ffb5c4]">{errors.domain.message}</p> : null}
        </form>
      </div>

      <DomainResults result={result} error={error} loading={loading} />
    </div>
  );
}
