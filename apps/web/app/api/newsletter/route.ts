import { newsletterSchema } from "@nxinmall/validators";
import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Landing page email capture: validates input and sends a transactional opt-in via Resend when configured.
 * Without `RESEND_API_KEY`, returns success and logs only (local dev friendly).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten().formErrors.join("; ") }, { status: 400 });
  }
  const { email } = parsed.data;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const resend = new Resend(key);
    await resend.emails.send({
      from: "NxinMall <onboarding@resend.dev>",
      to: process.env.NEWSLETTER_INBOX ?? "newsletter@example.com",
      subject: "NxinMall newsletter signup",
      text: `New signup: ${email}`,
    });
  } else {
    console.info("[newsletter] signup (no RESEND_API_KEY):", email);
  }
  return NextResponse.json({ success: true });
}
