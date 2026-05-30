"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Checkbox({ className, type = "checkbox", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="checkbox"
      className={cn(
        "size-5 shrink-0 rounded border border-input bg-background transition-[border-color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
