"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function DecimalInput({
  className,
  type = "text",
  inputMode = "decimal",
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      type={type}
      inputMode={inputMode}
      data-slot="decimal-input"
      className={cn(className)}
      {...props}
    />
  );
}

export { DecimalInput };
