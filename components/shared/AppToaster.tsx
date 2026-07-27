"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "border border-border/80 bg-background/95 text-foreground shadow-lg backdrop-blur-md",
          title: "font-medium",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
