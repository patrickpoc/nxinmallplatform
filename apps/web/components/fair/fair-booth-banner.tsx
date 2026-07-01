import Image from "next/image";

type Props = {
  url: string;
  alt?: string;
};

/** Full-width booth banner that preserves uploaded aspect ratio (no crop). */
export function FairBoothBanner({ url, alt = "" }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <Image
        src={url}
        alt={alt}
        width={0}
        height={0}
        sizes="(max-width: 640px) 100vw, 1024px"
        className="h-auto w-full object-contain"
        style={{ width: "100%", height: "auto" }}
        unoptimized
        priority
      />
    </div>
  );
}
