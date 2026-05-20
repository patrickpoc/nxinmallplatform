export type PortalMode = "buyer" | "seller";

export const PORTAL_MODE_COOKIE = "nxinmall-portal-mode";

export function defaultPortalModeForRole(role: string | undefined): PortalMode {
  return "buyer";
}

export function parsePortalMode(value: unknown): PortalMode {
  return value === "seller" ? "seller" : "buyer";
}
