import { prisma } from "@nxinmall/database";
import { auth } from "@/auth";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, or WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 2MB)." }, { status: 400 });
  }

  const ext = EXT[file.type] ?? "jpg";
  const filename = `${company.id}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "company-logos");
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);

  const url = `/uploads/company-logos/${filename}?v=${Date.now()}`;

  await prisma.company.update({
    where: { id: company.id },
    data: { logoUrl: url },
  });

  revalidatePath("/seller", "layout");

  return NextResponse.json({ url });
}
