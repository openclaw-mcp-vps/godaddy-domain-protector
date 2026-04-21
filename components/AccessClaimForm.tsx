"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccessClaimForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submitClaim = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const body = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setMessage(body.error || "Unable to unlock access.");
        return;
      }

      setMessage(body.message || "Access unlocked. Redirecting...");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage("Network error while claiming access. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submitClaim} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email used at checkout"
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Unlocking..." : "I Already Paid"}
      </Button>
      {message ? <p className="text-sm text-[#a8bbd4] sm:ml-2">{message}</p> : null}
    </form>
  );
}
