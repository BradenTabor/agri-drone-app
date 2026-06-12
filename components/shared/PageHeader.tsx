import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-0.5 hidden text-sm text-muted-foreground sm:block">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="w-full shrink-0 sm:w-auto [&_a]:flex [&_a]:w-full [&_a]:justify-center sm:[&_a]:w-auto">
          {action}
        </div>
      ) : null}
    </header>
  );
}
