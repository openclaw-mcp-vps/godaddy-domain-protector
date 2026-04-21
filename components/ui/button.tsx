import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117]",
  {
    variants: {
      variant: {
        default: "bg-[#4f8cff] text-[#f3f7ff] hover:bg-[#3b79ec] focus-visible:ring-[#4f8cff]",
        secondary: "bg-[#1b2636] text-[#d8e3f3] hover:bg-[#243349] focus-visible:ring-[#3f6ebf]",
        outline:
          "border border-[#32435c] bg-transparent text-[#d8e3f3] hover:border-[#4f8cff] hover:text-[#f0f6ff] focus-visible:ring-[#4f8cff]",
      },
      size: {
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        sm: "h-9 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
