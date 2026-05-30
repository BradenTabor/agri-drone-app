"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 items-center py-10">
      <Card className="w-full">
        <CardHeader className="p-5 pb-0">
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            We hit an unexpected issue while loading this page. Try again, or go
            back to the app home.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => reset()}>
              Try again
            </Button>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
