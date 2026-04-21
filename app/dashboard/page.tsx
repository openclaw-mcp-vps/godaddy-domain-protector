import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DomainSearchForm } from "@/components/DomainSearchForm";
import { Card } from "@/components/ui/card";
import { verifyAccessToken } from "@/lib/access";
import { ACCESS_COOKIE_NAME } from "@/lib/constants";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) {
    return email;
  }

  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const access = verifyAccessToken(token);

  if (!access) {
    redirect("/?paywall=1");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 pb-20 pt-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#86a2c8]">Protected Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-[#f4f9ff]">Anonymous Domain Checker</h1>
          <p className="mt-2 text-sm text-[#a8bdd9]">Active access for {maskEmail(access.email)}</p>
        </div>
        <Link className="text-sm font-semibold text-[#8bb6ff] hover:text-[#c2daff]" href="/">
          Back to Landing Page
        </Link>
      </div>

      <DomainSearchForm />

      <Card className="mt-8 p-5">
        <h2 className="text-lg font-semibold text-[#edf5ff]">Operational notes</h2>
        <p className="mt-2 text-sm text-[#a6bbd8]">
          To maximize privacy, run checks in bursts and only move to registration once you are ready to purchase. Avoid
          repeating searches for the same domain from public registrar pages.
        </p>
      </Card>
    </main>
  );
}
