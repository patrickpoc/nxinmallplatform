import { NextResponse } from "next/server";

/** Placeholder endpoint — validates token and updates `passwordHash` in production. */
export async function POST() {
  return NextResponse.json({ success: true });
}
