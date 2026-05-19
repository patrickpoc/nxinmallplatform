import { prisma } from "@nxinmall/database";

/**
 * Resolves a bearer token to a `User` row. The web app forwards `session.user.id` as JWT for API calls.
 * Replace with signed access tokens before production hardening.
 */
export async function getUserFromBearer(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const id = header.replace("Bearer ", "").trim();
  if (!id) {
    return null;
  }
  return prisma.user.findUnique({ where: { id } });
}
