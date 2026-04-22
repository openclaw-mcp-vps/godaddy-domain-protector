import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

import { DomainChecker } from "@/components/domain-checker";
import { buttonVariants } from "@/components/ui/button";
import { verifyAccessToken, ACCESS_COOKIE_NAME } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Run anonymous bulk domain availability checks."
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const access = verifyAccessToken(token);

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Domain Safety Dashboard</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {access
                ? `Access active for ${access.email}.`
                : "Access not active. Purchase and activate to use anonymous domain checks."}
            </p>
          </div>
          {!access ? (
            <Link href="/pricing" className={cn(buttonVariants({ variant: "outline" }))}>
              Unlock Access
            </Link>
          ) : null}
        </header>

        <DomainChecker />
      </div>
    </main>
  );
}
