"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "w-full min-h-11 rounded-md border border-input bg-background px-3 py-2.5 text-sm transition-[border-color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 sm:min-h-0 sm:py-2",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
