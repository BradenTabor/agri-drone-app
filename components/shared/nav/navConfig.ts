import {
  ClipboardList,
  DollarSign,
  FileStack,
  Home,
  type LucideIcon,
  Map,
  Package2,
  Settings2,
  Sprout,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  subtitle?: string;
  icon?: LucideIcon;
};

export const coreNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/records", label: "Mix Records", icon: Sprout },
  { href: "/app-records", label: "App Records", icon: FileStack },
  { href: "/map", label: "Map", icon: Map },
];

export const secondaryNavItems: NavItem[] = [
  { href: "/customers", label: "Customers", subtitle: "Grow customer records", icon: Users },
  { href: "/equipment", label: "Equipment", subtitle: "Manage drone fleet", icon: Settings2 },
  { href: "/products", label: "Products", subtitle: "Track materials", icon: Package2 },
  { href: "/pricing", label: "Pricing", subtitle: "Set default rates", icon: DollarSign },
  { href: "/quotes", label: "Quotes", subtitle: "Prepare estimates", icon: ClipboardList },
];

export type MobileQuickAction = {
  href: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
};

export const mobileQuickActions: MobileQuickAction[] = [
  {
    href: "/records/new",
    label: "New Mix",
    subtitle: "Start mix record",
    icon: Sprout,
  },
  {
    href: "/app-records/new",
    label: "New App",
    subtitle: "Log application",
    icon: FileStack,
  },
  {
    href: "/map",
    label: "Field Map",
    subtitle: "View coverage",
    icon: Map,
  },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

const allNavItems = [...coreNavItems, ...secondaryNavItems];

export function getNavBreadcrumb(pathname: string): NavItem[] {
  if (pathname === "/") {
    return [coreNavItems[0]!];
  }

  const activePage = allNavItems.find((item) => isActivePath(pathname, item.href));

  if (!activePage || activePage.href === "/") {
    return [coreNavItems[0]!];
  }

  return [coreNavItems[0]!, activePage];
}

export function getAllNavItems(): NavItem[] {
  return allNavItems;
}
