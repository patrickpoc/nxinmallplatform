import { prisma, prismaWrite } from "@nxinmall/database";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const hasDirectUrl = Boolean(process.env.DIRECT_URL?.trim());

  try {
    const [activeProducts, categories, reviews] = await Promise.all([
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.category.count(),
      prismaWrite.productReview.count().catch(() => -1),
    ]);

    return NextResponse.json({
      ok: true,
      env: { hasDatabaseUrl, hasDirectUrl },
      counts: { activeProducts, categories, reviews },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json(
      {
        ok: false,
        env: { hasDatabaseUrl, hasDirectUrl },
        error: message,
      },
      { status: 503 },
    );
  }
}
