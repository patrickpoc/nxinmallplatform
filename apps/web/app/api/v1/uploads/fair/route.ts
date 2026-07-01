import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fairUploadPath, uploadFairImage, validateFairImage } from "@/lib/uploads/supabase-storage";

export const runtime = "nodejs";

const PURPOSES = new Set(["pix", "product", "logo", "banner"]);

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "FAIR_VENDOR") {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const purpose = String(formData.get("purpose") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Missing file" } },
        { status: 400 },
      );
    }
    if (!PURPOSES.has(purpose)) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid purpose" } },
        { status: 400 },
      );
    }

    const validationError = validateFairImage(file);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: validationError } },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const path = fairUploadPath(purpose as "pix" | "product" | "logo" | "banner", session.user.id, file.name);
    const url = await uploadFairImage(buffer, file.type, path);

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    console.error("[api/v1/uploads/fair]", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message } },
      { status: 500 },
    );
  }
}
