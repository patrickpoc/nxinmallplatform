import { prisma, Prisma } from "@nxinmall/database";
import { productCreateSchema, productVariantSchema } from "@nxinmall/validators";
import { Hono } from "hono";
import { z } from "zod";
import { getUserFromBearer } from "../../lib/auth.js";
import { fail, ok } from "../../lib/envelope.js";
import { productNameContainsWhere } from "../../lib/product-search-where.js";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().uuid().optional(),
  /** Reserved for Meilisearch-backed search (Phase 2). */
  q: z.string().max(200).optional(),
});

const app = new Hono();

/**
 * Public product listing: returns ACTIVE products with primary image and category slug.
 * Search (`q`) is basic SQL ilike until Meilisearch is wired (Phase 2).
 */
app.get("/products", async (c) => {
  const parsed = querySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }
  const { page, limit, category, q } = parsed.data;
  const nameWhere = q ? productNameContainsWhere(q) : {};
  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(category ? { categoryId: category } : {}),
    ...(q ? nameWhere : {}),
  };

  try {
    const [total, rows] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { slug: true, name: true } },
          images: { where: { isPrimary: true }, take: 1 },
          variants: { take: 1, orderBy: { priceUsd: "asc" } },
        },
      }),
    ]);

    return c.json(
      ok(
        rows.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          category: p.category,
          primaryImage: p.images[0]?.url ?? null,
          fromPriceUsd: p.variants[0]?.priceUsd?.toString() ?? null,
        })),
        { page, total, limit },
      ),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Database error";
    return c.json(fail("DB_ERROR", msg), 503);
  }
});

const createProductSchema = productCreateSchema.extend({
  variants: z.array(productVariantSchema).min(1).max(50),
});

app.post("/products", async (c) => {
  const user = await getUserFromBearer(c.req.header("authorization"));
  if (!user || user.role !== "SELLER") {
    return c.json(fail("FORBIDDEN", "Only sellers can create products"), 403);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(fail("BAD_REQUEST", "Invalid JSON body"), 400);
  }
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(fail("VALIDATION_ERROR", parsed.error.flatten().formErrors.join("; ")), 400);
  }
  const d = parsed.data;
  try {
    const product = await prisma.product.create({
      data: {
        sellerId: user.id,
        categoryId: d.categoryId,
        name: d.name,
        description: d.description ?? undefined,
        status: d.status,
        variants: {
          create: d.variants.map((v) => ({
            sku: v.sku,
            priceUsd: new Prisma.Decimal(v.priceUsd),
            minOrderQty: v.minOrderQty,
            unit: v.unit,
            stockQty: v.stockQty,
            attributes: v.attributes !== undefined ? (v.attributes as Prisma.InputJsonValue) : undefined,
          })),
        },
      },
      include: { variants: true, category: true },
    });
    return c.json(ok(product), 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Database error";
    return c.json(fail("DB_ERROR", msg), 503);
  }
});

app.get("/products/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const p = await prisma.product.findFirst({
      where: { id, status: "ACTIVE" },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
        docs: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            company: {
              select: {
                name: true,
                country: true,
                verificationStatus: true,
                verificationTier: true,
              },
            },
          },
        },
      },
    });
    if (!p) {
      return c.json(fail("NOT_FOUND", "Product not found"), 404);
    }
    return c.json(ok(p));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Database error";
    return c.json(fail("DB_ERROR", msg), 503);
  }
});

export { app as productRoutes };
