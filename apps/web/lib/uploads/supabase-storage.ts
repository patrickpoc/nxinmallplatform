const BUCKET = "fair-assets";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function getConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase Storage is not configured");
  }
  return { url, key };
}

export function validateFairImage(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Invalid file type. Use JPEG, PNG or WebP.";
  }
  if (file.size > MAX_BYTES) {
    return "File too large. Maximum size is 2 MB.";
  }
  return null;
}

export async function uploadFairImage(
  file: ArrayBuffer,
  contentType: string,
  path: string,
): Promise<string> {
  const { url, key } = getConfig();
  const objectPath = path.replace(/^\//, "");

  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: new Blob([file], { type: contentType }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed (${res.status})`);
  }

  return `${url}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

export function fairUploadPath(
  purpose: "pix" | "product" | "logo" | "banner",
  userId: string,
  filename: string,
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${purpose}/${userId}/${Date.now()}-${safe}`;
}
