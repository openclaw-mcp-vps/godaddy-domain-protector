import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-[#2d3a4e] bg-[#111926] px-3 text-sm text-[#e6edf3] outline-none transition placeholder:text-[#6f8099] focus:border-[#4f8cff] focus:ring-1 focus:ring-[#4f8cff]",
        className,
      )}
      {...props}
    />
  );
}
