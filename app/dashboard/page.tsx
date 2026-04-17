import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DomainChecker } from "@/components/domain-checker";
import { Button } from "@/components/ui/button";
import { verifyAccessToken, accessCookieName } from "@/lib/auth";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(accessCookieName)?.value;

  if (!verifyAccessToken(token)) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 md:px-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Protected Domain Dashboard</h1>
          <p className="text-slate-400">Run private, batch availability checks with consensus across providers.</p>
        </div>
        <Button asChild variant="ghost">
          <a href="/">Back to landing</a>
        </Button>
      </div>
      <DomainChecker />
    </main>
  );
}
