import { handle } from "hono/vercel";
import { createApp } from "../src/app.js";

/** Vercel serverless entry — do not use src/app.ts directly. */
export default handle(createApp());
