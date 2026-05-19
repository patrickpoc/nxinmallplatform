import { prisma } from "@nxinmall/database";
import { Hono } from "hono";
import { ok } from "../../lib/envelope.js";

const app = new Hono();

/** Returns curated `PriceSignal` rows for the market intelligence dashboard (Phase 4 UI consumes this). */
app.get("/intelligence/price-signals", async (c) => {
  const rows = await prisma.priceSignal.findMany({ orderBy: { recordedAt: "desc" }, take: 200 });
  return c.json(ok(rows));
});

export { app as intelligenceRoutes };
