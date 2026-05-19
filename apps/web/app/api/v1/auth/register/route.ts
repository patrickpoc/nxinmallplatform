import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/register-user";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await registerUser(body);
    return NextResponse.json(result.envelope, { status: result.ok ? 201 : result.status });
  } catch (error) {
    console.error("[api/v1/auth/register]", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "INTERNAL_ERROR", message: "Registration failed" },
        meta: null,
      },
      { status: 500 },
    );
  }
}
