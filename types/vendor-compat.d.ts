declare module "@supabase/auth-js" {
  export interface AuthError extends Error {
    code?: string;
    status?: number;
  }

  export type User = {
    id: string;
    email?: string | null;
    [key: string]: unknown;
  };

  export type Session = {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    user?: User;
    [key: string]: unknown;
  };

  export type GoTrueClientOptions = {
    [key: string]: unknown;
  };

  export type UserResponse = {
    data: { user: User | null };
    error: AuthError | null;
  };

  export type AuthResponse = {
    data: { user: User | null; session: Session | null };
    error: AuthError | null;
  };

  export type Passkey = {
    id?: string;
    [key: string]: unknown;
  };

  export class AuthClient {
    getUser(): Promise<UserResponse>;
    signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse>;
    signUp(credentials: {
      email: string;
      password: string;
      options?: { data?: Record<string, unknown> };
    }): Promise<AuthResponse>;
    resetPasswordForEmail(
      email: string,
      options?: { redirectTo?: string },
    ): Promise<{ data: unknown; error: AuthError | null }>;
    signOut(): Promise<{ error: AuthError | null }>;
    signInWithPasskey(): Promise<AuthResponse>;
    registerPasskey(): Promise<{ data: unknown; error: AuthError | null }>;
    passkey: {
      list(): Promise<{ data: Passkey[] | null; error: AuthError | null }>;
    };
  }
}

declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";

  export type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

  export const AlertTriangle: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Building2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const CircleCheckBig: LucideIcon;
  export const CircleDot: LucideIcon;
  export const CircleSlash: LucideIcon;
  export const ClipboardCheck: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Droplets: LucideIcon;
  export const FileStack: LucideIcon;
  export const FlaskConical: LucideIcon;
  export const Gauge: LucideIcon;
  export const Home: LucideIcon;
  export const LogOut: LucideIcon;
  export const Map: LucideIcon;
  export const MapPinned: LucideIcon;
  export const Menu: LucideIcon;
  export const Package2: LucideIcon;
  export const Plus: LucideIcon;
  export const ScanFace: LucideIcon;
  export const Search: LucideIcon;
  export const Settings2: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Sprout: LucideIcon;
  export const Users: LucideIcon;
  export const Users2: LucideIcon;
  export const Wrench: LucideIcon;
  export const X: LucideIcon;
}
