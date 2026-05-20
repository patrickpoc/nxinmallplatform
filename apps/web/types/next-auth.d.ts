import type { DefaultSession } from "next-auth";
import type { PortalMode } from "@/lib/portal/portal-mode";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      portalMode: PortalMode;
    };
    portalMode?: PortalMode;
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    portalMode?: PortalMode;
  }
}
