"use client";

import Link from "next/link";
import { forwardRef, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

type NavMagneticLinkProps = ComponentProps<typeof Link>;

export const NavMagneticLink = forwardRef<HTMLAnchorElement, NavMagneticLinkProps>(function NavMagneticLink(
  { className, children, onMouseMove, onMouseLeave, ...props },
  ref,
) {
  function handleMouseMove(event: React.MouseEvent<HTMLAnchorElement>) {
    const link = event.currentTarget;
    const rect = link.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;
    link.style.setProperty("--nav-magnetic-x", `${offsetX * 0.14}px`);
    link.style.setProperty("--nav-magnetic-y", `${offsetY * 0.2}px`);
    onMouseMove?.(event);
  }

  function handleMouseLeave(event: React.MouseEvent<HTMLAnchorElement>) {
    const link = event.currentTarget;
    link.style.setProperty("--nav-magnetic-x", "0px");
    link.style.setProperty("--nav-magnetic-y", "0px");
    onMouseLeave?.(event);
  }

  return (
    <Link
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("nav-magnetic-link", className)}
      {...props}
    >
      {children}
    </Link>
  );
});
