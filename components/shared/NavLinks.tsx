"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/records", label: "Mix Records" },
  { href: "/app-records", label: "App Records" },
  { href: "/map", label: "Map" },
  { href: "/customers", label: "Customers" },
  { href: "/equipment", label: "Equipment" },
  { href: "/products", label: "Products" },
  { href: "/pricing", label: "Pricing" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavLinksProps = {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
};

export function NavLinks({ orientation = "horizontal", onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  const isVertical = orientation === "vertical";

  return (
    <nav className={cn("flex", isVertical ? "flex-col gap-2" : "flex-wrap items-center gap-1")}>
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: active ? "secondary" : "ghost",
                size: isVertical ? "default" : "sm",
              }),
              isVertical && "w-full justify-start px-4",
              active && "font-semibold",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
