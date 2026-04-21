import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#263549] bg-[#111926]/85 shadow-[0_10px_40px_-22px_rgba(79,140,255,0.55)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
