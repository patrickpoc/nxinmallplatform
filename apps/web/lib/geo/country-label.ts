const COUNTRY_NAMES: Record<string, { en: string; pt: string; zh: string }> = {
  BR: { en: "Brazil", pt: "Brasil", zh: "巴西" },
  US: { en: "United States", pt: "Estados Unidos", zh: "美国" },
  CN: { en: "China", pt: "China", zh: "中国" },
  AR: { en: "Argentina", pt: "Argentina", zh: "阿根廷" },
  CL: { en: "Chile", pt: "Chile", zh: "智利" },
  PE: { en: "Peru", pt: "Peru", zh: "秘鲁" },
  MX: { en: "Mexico", pt: "México", zh: "墨西哥" },
  UY: { en: "Uruguay", pt: "Uruguai", zh: "乌拉圭" },
  PY: { en: "Paraguay", pt: "Paraguai", zh: "巴拉圭" },
  CO: { en: "Colombia", pt: "Colômbia", zh: "哥伦比亚" },
  IN: { en: "India", pt: "Índia", zh: "印度" },
  AU: { en: "Australia", pt: "Austrália", zh: "澳大利亚" },
  DE: { en: "Germany", pt: "Alemanha", zh: "德国" },
  NL: { en: "Netherlands", pt: "Países Baixos", zh: "荷兰" },
  FR: { en: "France", pt: "França", zh: "法国" },
  ZA: { en: "South Africa", pt: "África do Sul", zh: "南非" },
  TH: { en: "Thailand", pt: "Tailândia", zh: "泰国" },
  VN: { en: "Vietnam", pt: "Vietnã", zh: "越南" },
  ID: { en: "Indonesia", pt: "Indonésia", zh: "印度尼西亚" },
  MY: { en: "Malaysia", pt: "Malásia", zh: "马来西亚" },
  PH: { en: "Philippines", pt: "Filipinas", zh: "菲律宾" },
};

export function countryLabel(code: string, locale: string): string {
  const upper = code.slice(0, 2).toUpperCase();
  const entry = COUNTRY_NAMES[upper];
  if (!entry) return upper;
  const key = locale as "en" | "pt" | "zh";
  return entry[key] ?? entry.en;
}
