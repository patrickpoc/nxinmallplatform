function digits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function maskPhone(raw: string): string {
  const isInternational = raw.startsWith("+");
  const d = digits(raw);
  if (d.length === 0) return isInternational ? "+" : "";

  if (isInternational) {
    if (d.length <= 2) return `+${d}`;
    if (d.length <= 4) return `+${d.slice(0, 2)} ${d.slice(2)}`;
    if (d.length <= 9) return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4)}`;
    const body = d.slice(4, Math.min(d.length, 13));
    if (body.length <= 5) return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${body}`;
    return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${body.slice(0, 5)}-${body.slice(5)}`;
  }

  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function maskCpf(raw: string): string {
  const d = digits(raw).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskCnpj(raw: string): string {
  const d = digits(raw).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskCep(raw: string): string {
  const d = digits(raw).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function maskCardNumber(raw: string): string {
  const d = digits(raw).slice(0, 16);
  const groups: string[] = [];
  for (let i = 0; i < d.length; i += 4) {
    groups.push(d.slice(i, i + 4));
  }
  return groups.join(" ");
}

export function maskExpiry(raw: string): string {
  const d = digits(raw).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}
