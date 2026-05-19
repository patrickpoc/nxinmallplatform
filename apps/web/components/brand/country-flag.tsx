type CountryFlagProps = {
  code: string;
  className?: string;
};

/** Renders a regional indicator symbol from ISO 3166-1 alpha-2 (emoji flag). */
export function CountryFlag({ code, className }: CountryFlagProps) {
  const upper = code.slice(0, 2).toUpperCase();
  const A = 0x41;
  const regional = [...upper].map((c) => 0x1f1e6 - A + c.charCodeAt(0));
  const emoji = String.fromCodePoint(...regional);
  return (
    <span className={className} title={upper} aria-hidden>
      {emoji}
    </span>
  );
}
