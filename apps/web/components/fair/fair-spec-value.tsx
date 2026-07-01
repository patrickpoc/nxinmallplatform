import Image from "next/image";

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatPlainValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function isImageSpecKey(specKey: string): boolean {
  const key = specKey.toLowerCase();
  return key === "imageurl" || key === "imageurls" || key.endsWith("imageurl") || key.endsWith("image");
}

function SpecImage({ url, size = "md" }: { url: string; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28";
  return (
    <div
      className={`relative ${box} max-w-full overflow-hidden rounded-md border border-border bg-white`}
    >
      <Image src={url} alt="" fill className="object-contain p-1" unoptimized sizes="112px" />
    </div>
  );
}

type Props = {
  specKey: string;
  value: unknown;
};

export function FairSpecValue({ specKey, value }: Props) {
  const renderAsImage = isImageSpecKey(specKey);

  if (renderAsImage && Array.isArray(value)) {
    const urls = value.filter(isHttpUrl);
    if (urls.length > 0) {
      return (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <SpecImage key={url} url={url} size="sm" />
          ))}
        </div>
      );
    }
  }

  if (renderAsImage && isHttpUrl(value)) {
    return <SpecImage url={value} />;
  }

  return <span className="text-brand-gray">{formatPlainValue(value)}</span>;
}

export function fairSpecKeyLabel(
  key: string,
  labels: { variantLabel: string; image: string; images: string },
): string {
  const normalized = key.toLowerCase();
  if (normalized === "label") return labels.variantLabel;
  if (normalized === "imageurl") return labels.image;
  if (normalized === "imageurls") return labels.images;
  return key.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
