import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { existsSync } from "fs";
import { join } from "path";
import { Prisma, PrismaClient } from "@prisma/client";

// Carrega `.env` do pacote `database` (monorepo: cwd pode ser a raiz do repo ou `packages/database`).
const envCandidates = [
  join(process.cwd(), ".env"),
  join(process.cwd(), "packages", "database", ".env"),
  join(process.cwd(), "..", ".env"),
];
for (const p of envCandidates) {
  if (existsSync(p)) {
    // `override: true` — se existir DATABASE_URL antiga no Windows (ex.: localhost), usa o `.env` do projeto.
    config({ path: p, override: true });
    break;
  }
}

const prisma = new PrismaClient();

const DEMO_PRODUCTS_PER_CATEGORY = 25;
const UNITS = ["KG", "TON", "UNIT", "BOX", "PALLET"] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 1000) / 1000;
}

const REVIEW_AUTHORS = [
  "Ana Costa",
  "Carlos Mendes",
  "Li Wei",
  "Maria Silva",
  "João Ferreira",
  "Farm Co-op SP",
  "Agro Norte Ltd",
  "Green Valley Trading",
  "Rural Supply BR",
  "Harvest Partners",
];

const REVIEW_BODIES_EN = [
  "Solid product quality and packaging. Delivery matched the quoted lead time.",
  "Good value for bulk orders. Would buy again for the next season.",
  "Responsive seller and clear specs on the datasheet.",
  "Met our MOQ requirements without issues. Recommended for B2B buyers.",
  "Consistent batches; minor delay on logistics but overall satisfied.",
];

const REVIEW_BODIES_PT = [
  "Qualidade consistente e embalagem adequada. Prazo de entrega conforme combinado.",
  "Bom custo-benefício em volume. Compraria novamente na próxima safra.",
  "Vendedor atencioso e ficha técnica clara.",
  "Atendeu nosso pedido mínimo sem problemas. Recomendo para compradores B2B.",
  "Lotes uniformes; pequeno atraso logístico, mas experiência positiva no geral.",
];

/**
 * Product reviews for PDP / carousels / category cards.
 * Re-run with refresh: SEED_REFRESH_PRODUCT_REVIEWS=1 pnpm db:seed:reviews
 * (~90% of ACTIVE products get reviews; ~10% stay empty for "no ratings yet" UI)
 */
async function seedProductReviews() {
  const refresh =
    process.env.SEED_REFRESH_PRODUCT_REVIEWS === "1" || process.argv.includes("--refresh-reviews");
  const existing = await prisma.productReview.count();

  if (existing > 0 && !refresh) {
    console.log(`[seed] Product reviews already present (${existing}); skipping. Set SEED_REFRESH_PRODUCT_REVIEWS=1 to rebuild.`);
    return;
  }

  if (refresh && existing > 0) {
    await prisma.productReview.deleteMany({});
    console.log(`[seed] Cleared ${existing} existing product review(s) for refresh.`);
  }

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  const rows: {
    productId: string;
    authorName: string;
    rating: number;
    body: string;
    locale: string;
    createdAt: Date;
  }[] = [];

  let withoutReviews = 0;
  const now = Date.now();

  for (const p of products) {
    const rng = seededRandom(p.id);
    if (rng < 0.1) {
      withoutReviews += 1;
      continue;
    }
    const count = 5 + Math.floor(rng * 8);
    for (let i = 0; i < count; i++) {
      const r2 = seededRandom(`${p.id}-${i}`);
      const locale = r2 < 0.55 ? "pt" : "en";
      const rating = 3 + Math.floor(r2 * 3);
      const author = REVIEW_AUTHORS[Math.floor(r2 * REVIEW_AUTHORS.length)]!;
      const bodyPool = locale === "pt" ? REVIEW_BODIES_PT : REVIEW_BODIES_EN;
      const body = bodyPool[Math.floor(r2 * bodyPool.length)]!;
      const daysAgo = Math.floor(r2 * 365);
      rows.push({
        productId: p.id,
        authorName: author,
        rating,
        body,
        locale,
        createdAt: new Date(now - daysAgo * 86400000),
      });
    }
  }

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    await prisma.productReview.createMany({ data: rows.slice(i, i + batchSize) });
  }

  const withReviews = products.length - withoutReviews;
  console.log(
    `[seed] Created ${rows.length} product review(s) for ${withReviews}/${products.length} active products (${withoutReviews} without reviews for empty-state demo).`,
  );
  await notifyCatalogRevalidate();
}

/** POST CATALOG_REVALIDATE_URL after review seed (e.g. production /api/catalog/revalidate?secret=...). */
async function notifyCatalogRevalidate() {
  const url = process.env.CATALOG_REVALIDATE_URL?.trim();
  if (!url) {
    console.log(
      "[seed] Tip: set CATALOG_REVALIDATE_URL to your app POST /api/catalog/revalidate?secret=... to bust rating cache.",
    );
    return;
  }
  try {
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) {
      console.warn(`[seed] Catalog revalidate failed: HTTP ${res.status}`);
      return;
    }
    console.log("[seed] Catalog cache revalidated (ratings, home rails, categories).");
  } catch (error) {
    console.warn("[seed] Catalog revalidate request failed:", error);
  }
}

/** Marks ~12 ACTIVE products as sponsored for the home carousel (idempotent). */
async function seedSponsoredProducts() {
  const active = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (active.length === 0) return;

  const picks: string[] = [];
  for (const p of active) {
    if (seededRandom(`sponsor-${p.id}`) > 0.82) picks.push(p.id);
    if (picks.length >= 12) break;
  }
  if (picks.length < 12) {
    for (const p of active) {
      if (!picks.includes(p.id)) picks.push(p.id);
      if (picks.length >= 12) break;
    }
  }

  await prisma.product.updateMany({
    where: { isSponsored: true },
    data: { isSponsored: false, sponsoredSortOrder: null },
  });
  for (let i = 0; i < picks.length; i++) {
    await prisma.product.update({
      where: { id: picks[i]! },
      data: { isSponsored: true, sponsoredSortOrder: i },
    });
  }
  console.log(`[seed] Marked ${picks.length} product(s) as sponsored for home carousel.`);
}

function randomPriceUsd(): Prisma.Decimal {
  const v = 4 + Math.random() * 19995;
  return new Prisma.Decimal(v.toFixed(2));
}

function randomPriceBrl(): Prisma.Decimal {
  // Rough BRL scale for demo data; front-end conversion validates UX.
  const v = 20 + Math.random() * 100000;
  return new Prisma.Decimal(v.toFixed(2));
}

function randomUnit(): (typeof UNITS)[number] {
  return UNITS[randomInt(0, UNITS.length - 1)]!;
}

function picsumUrl(seed: string): string {
  const safe = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40) || "nxm";
  return `https://picsum.photos/seed/${safe}/800/800`;
}

const ADJECTIVES_EN = ["Premium", "Standard", "Organic", "Bulk", "Industrial", "Certified", "Export", "Regional"];
const ADJECTIVES_PT = ["Premium", "Standard", "Orgânico", "Granel", "Industrial", "Certificado", "Exportação", "Regional"];
const ADJECTIVES_ZH = ["优质", "标准", "有机", "大宗", "工业", "认证", "出口", "区域"];

const NOUNS_EN = ["Supply", "Blend", "Kit", "Line", "Batch", "Pack", "Solution", "Mix"];
const NOUNS_PT = ["Fornecimento", "Mistura", "Kit", "Linha", "Lote", "Pacote", "Solução", "Mix"];
const NOUNS_ZH = ["供应", "配方", "套装", "系列", "批次", "包装", "方案", "混合"];

/**
 * Garante vários produtos ACTIVE por categoria (vendedor demo), com imagem/prço/estoque aleatórios — idempotente.
 */
async function ensureRandomDemoProductsPerCategory(sellerIds: string[]): Promise<void> {
  let created = 0;
  const categories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    orderBy: { slug: "asc" },
    select: { id: true, slug: true, name: true },
  });
  for (const cat of categories) {
    const existing = await prisma.product.count({
      where: { categoryId: cat.id },
    });
    const toCreate = Math.max(0, DEMO_PRODUCTS_PER_CATEGORY - existing);
    const baseName = (cat.name as { en?: string }).en ?? cat.slug;

    for (let i = 0; i < toCreate; i++) {
      const ai = randomInt(0, ADJECTIVES_EN.length - 1);
      const ni = randomInt(0, NOUNS_EN.length - 1);
      const suffix = randomInt(1000, 9999);
      const sku = `RND-${cat.slug}-${suffix}-${i}-${Date.now().toString(36)}`.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
      const name = {
        en: `${ADJECTIVES_EN[ai]} ${baseName} ${NOUNS_EN[ni]} #${suffix}`,
        pt: `${ADJECTIVES_PT[ai]} ${(cat.name as { pt?: string }).pt ?? baseName} ${NOUNS_PT[ni]} #${suffix}`,
        zh: `${ADJECTIVES_ZH[ai]} ${(cat.name as { zh?: string }).zh ?? baseName}${NOUNS_ZH[ni]} #${suffix}`,
      };
      const desc = {
        en: `Auto-generated demo listing for QA (${cat.slug}). SKU ${sku}.`,
        pt: `Anúncio demo automático para testes (${cat.slug}). SKU ${sku}.`,
        zh: `演示商品（${cat.slug}）。SKU ${sku}。`,
      };

      const sellerId = sellerIds[randomInt(0, sellerIds.length - 1)]!;
      await prisma.product.create({
        data: {
          sellerId,
          categoryId: cat.id,
          name,
          description: desc,
          status: "ACTIVE",
          images: {
            create: [
              {
                url: picsumUrl(`${cat.slug}${suffix}${randomInt(1, 999999)}`),
                isPrimary: true,
                sortOrder: 0,
              },
            ],
          },
          variants: {
            create: [
              {
                sku,
                ...(randomInt(0, 1) === 0
                  ? { priceUsd: randomPriceUsd(), priceAmount: randomPriceUsd(), priceCurrency: "USD" as const }
                  : { priceUsd: new Prisma.Decimal("0"), priceAmount: randomPriceBrl(), priceCurrency: "BRL" as const }),
                minOrderQty: randomInt(1, 25),
                unit: randomUnit(),
                stockQty: randomInt(0, 800),
              },
            ],
          },
        },
      });
      created += 1;
    }
  }
  if (created > 0) {
    console.log(`[seed] Added ${created} random demo product(s) (${DEMO_PRODUCTS_PER_CATEGORY} target per category).`);
  }
}

/**
 * Seeds top-level product categories with multilingual names for catalog and RFQ flows.
 * Run after migrations: `pnpm db:seed` from repo root.
 */
async function main() {
  if (process.argv.includes("--refresh-reviews")) {
    await seedProductReviews();
    return;
  }
  if (process.argv.includes("--refresh-sponsored")) {
    await seedSponsoredProducts();
    return;
  }

  const roots = [
    {
      slug: "agri-inputs",
      name: { en: "Agri Inputs", pt: "Insumos agrícolas", zh: "农业投入品" },
    },
    {
      slug: "equipment",
      name: { en: "Equipment", pt: "Equipamentos", zh: "农业设备" },
    },
    { slug: "seeds", name: { en: "Seeds", pt: "Sementes", zh: "种子" } },
    { slug: "feed", name: { en: "Feed", pt: "Ração", zh: "饲料" } },
    {
      slug: "technology",
      name: { en: "Technology", pt: "Tecnologia", zh: "农业技术" },
    },
    {
      slug: "services",
      name: { en: "Services", pt: "Serviços", zh: "服务" },
    },
  ];

  for (const c of roots) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name },
      update: { name: c.name },
    });
  }

  const subcategories: { parentSlug: string; slug: string; name: { en: string; pt: string; zh: string } }[] = [
    { parentSlug: "agri-inputs", slug: "fertilizers",  name: { en: "Fertilizers",      pt: "Fertilizantes",     zh: "肥料" } },
    { parentSlug: "agri-inputs", slug: "pesticides",   name: { en: "Pesticides",       pt: "Defensivos",        zh: "农药" } },
    { parentSlug: "agri-inputs", slug: "adjuvants",    name: { en: "Adjuvants",        pt: "Adjuvantes",        zh: "助剂" } },
    { parentSlug: "agri-inputs", slug: "soil-amendments", name: { en: "Soil Amendments", pt: "Corretivos",      zh: "土壤改良剂" } },
    { parentSlug: "equipment",   slug: "tractors",     name: { en: "Tractors",          pt: "Tratores",          zh: "拖拉机" } },
    { parentSlug: "equipment",   slug: "implements",   name: { en: "Implements",        pt: "Implementos",       zh: "农具" } },
    { parentSlug: "equipment",   slug: "irrigation",   name: { en: "Irrigation",        pt: "Irrigação",         zh: "灌溉设备" } },
    { parentSlug: "equipment",   slug: "drones",       name: { en: "Drones",            pt: "Drones",            zh: "无人机" } },
    { parentSlug: "seeds",       slug: "corn-seeds",   name: { en: "Corn",              pt: "Milho",             zh: "玉米" } },
    { parentSlug: "seeds",       slug: "soy-seeds",    name: { en: "Soy",               pt: "Soja",              zh: "大豆" } },
    { parentSlug: "seeds",       slug: "wheat-seeds",  name: { en: "Wheat",             pt: "Trigo",             zh: "小麦" } },
    { parentSlug: "seeds",       slug: "vegetables",   name: { en: "Vegetables",        pt: "Hortaliças",        zh: "蔬菜" } },
    { parentSlug: "feed",        slug: "cattle-feed",  name: { en: "Cattle",            pt: "Bovinos",           zh: "牛饲料" } },
    { parentSlug: "feed",        slug: "poultry-feed", name: { en: "Poultry",           pt: "Aves",              zh: "禽饲料" } },
    { parentSlug: "feed",        slug: "swine-feed",   name: { en: "Swine",             pt: "Suínos",            zh: "猪饲料" } },
    { parentSlug: "feed",        slug: "equine-feed",  name: { en: "Equine",            pt: "Equinos",           zh: "马饲料" } },
    { parentSlug: "technology",  slug: "agri-software", name: { en: "Software",         pt: "Software",          zh: "软件" } },
    { parentSlug: "technology",  slug: "sensors",      name: { en: "Sensors",           pt: "Sensores",          zh: "传感器" } },
    { parentSlug: "technology",  slug: "gps-systems",  name: { en: "GPS Systems",       pt: "Sistemas GPS",      zh: "GPS系统" } },
    { parentSlug: "technology",  slug: "automation",   name: { en: "Automation",        pt: "Automação",         zh: "自动化" } },
    { parentSlug: "services",    slug: "consulting",   name: { en: "Consulting",        pt: "Consultoria",       zh: "咨询" } },
    { parentSlug: "services",    slug: "soil-analysis", name: { en: "Soil Analysis",    pt: "Análise de solo",   zh: "土壤分析" } },
    { parentSlug: "services",    slug: "transport",    name: { en: "Transport",         pt: "Transporte",        zh: "运输" } },
    { parentSlug: "services",    slug: "insurance",    name: { en: "Insurance",         pt: "Seguro",            zh: "保险" } },
  ];

  for (const sc of subcategories) {
    const parent = await prisma.category.findUnique({ where: { slug: sc.parentSlug } });
    if (!parent) continue;
    await prisma.category.upsert({
      where: { slug: sc.slug },
      create: { slug: sc.slug, name: sc.name, parentId: parent.id },
      update: { name: sc.name, parentId: parent.id },
    });
  }

  const adminEmail = "admin@nxinmall.local";
  const adminPasswordHash = await bcrypt.hash("admin", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Administrator",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
    update: {
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      name: "Administrator",
    },
  });

  const demoBuyerEmail = "demo-buyer@nxinmall.local";
  const demoBuyerHash = await bcrypt.hash("demo", 10);
  await prisma.user.upsert({
    where: { email: demoBuyerEmail },
    create: {
      email: demoBuyerEmail,
      name: "Demo Buyer",
      passwordHash: demoBuyerHash,
      role: "BUYER",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
    update: {
      passwordHash: demoBuyerHash,
      role: "BUYER",
      status: "ACTIVE",
      emailVerified: new Date(),
      name: "Demo Buyer",
    },
  });

  // Demo seller tour: demo-seller@nxinmall.local / demo (role SELLER, company APPROVED)
  const sellerProfiles = [
    { email: "demo-seller@nxinmall.local",     name: "NxinMall Demo Store",     company: "NxinMall Demo Store",      legalName: "NxinMall Comércio Ltda",         cnpj: "12.345.678/0001-90", country: "BR" },
    { email: "agrobrasil@nxinmall.local",      name: "AgroBrasil",              company: "AgroBrasil Ltda",          legalName: "AgroBrasil Comércio Ltda",       cnpj: "23.456.789/0001-01", country: "BR" },
    { email: "farmtech@nxinmall.local",        name: "FarmTech Solutions",       company: "FarmTech Solutions Inc",   legalName: null,                             cnpj: null,                 country: "US" },
    { email: "cerrado@nxinmall.local",         name: "Cerrado Sementes",         company: "Cerrado Sementes SA",      legalName: "Cerrado Sementes e Mudas SA",    cnpj: "34.567.890/0001-12", country: "BR" },
    { email: "pampa@nxinmall.local",           name: "Pampa Insumos",            company: "Pampa Insumos Agrícolas",  legalName: "Pampa Insumos Agrícolas Ltda",   cnpj: "45.678.901/0001-23", country: "BR" },
    { email: "tropicrop@nxinmall.local",       name: "TropiCrop",                company: "TropiCrop SAS",            legalName: null,                             cnpj: null,                 country: "CO" },
    { email: "sulagro@nxinmall.local",         name: "SulAgro Distribuidora",    company: "SulAgro Distribuidora",    legalName: "SulAgro Distribuidora Ltda",     cnpj: "56.789.012/0001-34", country: "BR" },
    { email: "nordeste@nxinmall.local",        name: "Nordeste Agri",            company: "Nordeste Agri",            legalName: "Nordeste Agri Comércio Ltda",    cnpj: "67.890.123/0001-45", country: "BR" },
    { email: "greenfield@nxinmall.local",      name: "GreenField Intl",          company: "GreenField International", legalName: null,                             cnpj: null,                 country: "DE" },
    { email: "asiapacific@nxinmall.local",     name: "AsiaPacific Feeds",        company: "AsiaPacific Feeds Co",     legalName: null,                             cnpj: null,                 country: "CN" },
  ];

  const sellerPasswordHash = await bcrypt.hash("demo", 10);
  const sellerIds: string[] = [];

  for (const sp of sellerProfiles) {
    const user = await prisma.user.upsert({
      where: { email: sp.email },
      create: {
        email: sp.email,
        name: sp.name,
        passwordHash: sellerPasswordHash,
        role: "SELLER",
        status: "ACTIVE",
        emailVerified: new Date(),
      },
      update: {
        passwordHash: sellerPasswordHash,
        role: "SELLER",
        status: "ACTIVE",
        emailVerified: new Date(),
        name: sp.name,
      },
    });
    sellerIds.push(user.id);

    await prisma.company.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: sp.company,
        legalName: sp.legalName,
        cnpj: sp.cnpj,
        country: sp.country,
        type: "SELLER",
        verificationStatus: "APPROVED",
      },
      update: {
        name: sp.company,
        legalName: sp.legalName,
        cnpj: sp.cnpj,
        country: sp.country,
        verificationStatus: "APPROVED",
      },
    });
  }
  console.log(`[seed] Upserted ${sellerIds.length} sellers with companies.`);

  const demoProductCount = await prisma.product.count({ where: { sellerId: { in: sellerIds } } });
  if (demoProductCount === 0) {
    const catSeeds = await prisma.category.findFirst({ where: { slug: "corn-seeds" } });
    const catEquipment = await prisma.category.findFirst({ where: { slug: "irrigation" } });
    if (catSeeds) {
      await prisma.product.create({
        data: {
          sellerId: sellerIds[0]!,
          categoryId: catSeeds.id,
          name: { en: "Hybrid maize seeds (demo)", pt: "Sementes de milho híbrido (demo)", zh: "杂交玉米种子（演示）" },
          description: {
            en: "High-yield demo listing for marketplace layout.",
            pt: "Anúncio de demonstração para layout do marketplace.",
            zh: "用于市场首页布局演示的商品。",
          },
          status: "ACTIVE",
          images: {
            create: [{ url: "https://picsum.photos/seed/nxinmall-seed/800/800", isPrimary: true, sortOrder: 0 }],
          },
          variants: {
            create: [{
              sku: "SEED-DEMO-CATALOG-1",
              priceUsd: new Prisma.Decimal("89.5"),
              priceAmount: new Prisma.Decimal("89.5"),
              priceCurrency: "USD",
              minOrderQty: 1,
              unit: "TON",
              stockQty: 120,
            }],
          },
        },
      });
    }
    if (catEquipment) {
      await prisma.product.create({
        data: {
          sellerId: sellerIds[2] ?? sellerIds[0]!,
          categoryId: catEquipment.id,
          name: { en: "Irrigation pump unit (demo)", pt: "Bomba de irrigação (demo)", zh: "灌溉泵机组（演示）" },
          description: {
            en: "Demo SKU with image for hero and carousels.",
            pt: "SKU de demonstração com imagem.",
            zh: "带主图的演示商品。",
          },
          status: "ACTIVE",
          images: {
            create: [{ url: "https://picsum.photos/seed/nxinmall-pump/800/800", isPrimary: true, sortOrder: 0 }],
          },
          variants: {
            create: [{
              sku: "SEED-DEMO-CATALOG-2",
              priceUsd: new Prisma.Decimal("1240"),
              priceAmount: new Prisma.Decimal("1240"),
              priceCurrency: "USD",
              minOrderQty: 1,
              unit: "UNIT",
              stockQty: 15,
            }],
          },
        },
      });
    }
  }

  // Backfill existing variants created before currency support (priceUsd -> priceAmount, USD).
  // `db push` added a default(0) for priceAmount, so older rows will typically be 0.
  await prisma.$executeRaw`
    UPDATE "ProductVariant"
    SET "priceAmount" = "priceUsd", "priceCurrency" = 'USD'
    WHERE "priceAmount" = 0 AND "priceUsd" <> 0
  `;

  // Reassign products from parent categories to random subcategories and random sellers
  const parentCats = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: { select: { id: true } } },
  });
  for (const parent of parentCats) {
    if (parent.children.length === 0) continue;
    const childIds = parent.children.map((c) => c.id);
    const products = await prisma.product.findMany({
      where: { categoryId: parent.id },
      select: { id: true },
    });
    for (const product of products) {
      const randomChildId = childIds[randomInt(0, childIds.length - 1)]!;
      const randomSellerId = sellerIds[randomInt(0, sellerIds.length - 1)]!;
      await prisma.product.update({
        where: { id: product.id },
        data: { categoryId: randomChildId, sellerId: randomSellerId },
      });
    }
    if (products.length > 0) {
      console.log(`[seed] Moved ${products.length} product(s) from ${parent.slug} to subcategories with random sellers.`);
    }
  }

  // Reassign all existing products to random sellers
  const allProducts = await prisma.product.findMany({ select: { id: true } });
  for (const product of allProducts) {
    const randomSellerId = sellerIds[randomInt(0, sellerIds.length - 1)]!;
    await prisma.product.update({
      where: { id: product.id },
      data: { sellerId: randomSellerId },
    });
  }
  console.log(`[seed] Reassigned ${allProducts.length} product(s) to random sellers.`);

  await ensureRandomDemoProductsPerCategory(sellerIds);

  await seedProductReviews();
  await seedSponsoredProducts();

  const cat = await prisma.category.findFirst({ where: { slug: "agri-inputs" } });
  if (cat && (await prisma.priceSignal.count()) === 0) {
    await prisma.priceSignal.createMany({
      data: [
        {
          categoryId: cat.id,
          regionCode: "BR",
          priceUsd: 520,
          unit: "TON",
          source: "seed",
        },
        {
          categoryId: cat.id,
          regionCode: "PE",
          priceUsd: 535,
          unit: "TON",
          source: "seed",
        },
      ],
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
