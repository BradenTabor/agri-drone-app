import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const formAlertVariants = cva("rounded-md border px-3 py-2 text-sm", {
  variants: {
    variant: {
      error: "border-destructive/40 bg-destructive/10 text-destructive",
      success: "border-primary/30 bg-primary/10 text-primary",
      info: "border-border bg-muted/40 text-foreground",
    },
  },
  defaultVariants: {
    variant: "error",
  },
});

type FormAlertProps = React.ComponentProps<"div"> & VariantProps<typeof formAlertVariants>;

function FormAlert({ className, variant, ...props }: FormAlertProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      data-slot="form-alert"
      className={cn(formAlertVariants({ variant }), className)}
      {...props}
    />
  );
}

export { FormAlert };
