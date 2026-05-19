import type { FreightOption } from "./checkout-types";

type CepEntry = { city: string; state: string; neighborhood: string; street: string };

const CEP_CITY_MAP: Record<string, CepEntry> = {
  "01": { city: "São Paulo", state: "SP", neighborhood: "Centro", street: "Rua Direita" },
  "02": { city: "São Paulo", state: "SP", neighborhood: "Santana", street: "Rua Voluntários da Pátria" },
  "03": { city: "São Paulo", state: "SP", neighborhood: "Mooca", street: "Rua da Mooca" },
  "04": { city: "São Paulo", state: "SP", neighborhood: "Vila Mariana", street: "Rua Domingos de Morais" },
  "05": { city: "São Paulo", state: "SP", neighborhood: "Pinheiros", street: "Rua dos Pinheiros" },
  "06": { city: "Osasco", state: "SP", neighborhood: "Centro", street: "Av. dos Autonomistas" },
  "07": { city: "Guarulhos", state: "SP", neighborhood: "Centro", street: "Av. Tiradentes" },
  "08": { city: "São Paulo", state: "SP", neighborhood: "São Mateus", street: "Av. Mateo Bei" },
  "09": { city: "Santo André", state: "SP", neighborhood: "Centro", street: "Rua Coronel Oliveira Lima" },
  "13": { city: "Campinas", state: "SP", neighborhood: "Centro", street: "Rua Barão de Jaguara" },
  "14": { city: "Ribeirão Preto", state: "SP", neighborhood: "Centro", street: "Rua General Osório" },
  "20": { city: "Rio de Janeiro", state: "RJ", neighborhood: "Centro", street: "Av. Rio Branco" },
  "21": { city: "Rio de Janeiro", state: "RJ", neighborhood: "Ilha do Governador", street: "Estrada do Galeão" },
  "22": { city: "Rio de Janeiro", state: "RJ", neighborhood: "Copacabana", street: "Av. Atlântica" },
  "24": { city: "Niterói", state: "RJ", neighborhood: "Centro", street: "Rua Visconde de Itaboraí" },
  "30": { city: "Belo Horizonte", state: "MG", neighborhood: "Centro", street: "Av. Afonso Pena" },
  "31": { city: "Belo Horizonte", state: "MG", neighborhood: "Lagoinha", street: "Rua Itapecerica" },
  "40": { city: "Salvador", state: "BA", neighborhood: "Centro", street: "Av. Sete de Setembro" },
  "50": { city: "Recife", state: "PE", neighborhood: "Boa Vista", street: "Rua do Sol" },
  "60": { city: "Fortaleza", state: "CE", neighborhood: "Centro", street: "Rua Guilherme Rocha" },
  "64": { city: "Teresina", state: "PI", neighborhood: "Centro", street: "Rua Álvaro Mendes" },
  "66": { city: "Belém", state: "PA", neighborhood: "Centro", street: "Av. Presidente Vargas" },
  "69": { city: "Manaus", state: "AM", neighborhood: "Centro", street: "Av. Eduardo Ribeiro" },
  "70": { city: "Brasília", state: "DF", neighborhood: "Asa Sul", street: "SQS 308" },
  "74": { city: "Goiânia", state: "GO", neighborhood: "Centro", street: "Av. Goiás" },
  "78": { city: "Cuiabá", state: "MT", neighborhood: "Centro", street: "Av. Getúlio Vargas" },
  "79": { city: "Campo Grande", state: "MS", neighborhood: "Centro", street: "Rua 14 de Julho" },
  "80": { city: "Curitiba", state: "PR", neighborhood: "Centro", street: "Rua XV de Novembro" },
  "82": { city: "Curitiba", state: "PR", neighborhood: "Santa Felicidade", street: "Av. Manoel Ribas" },
  "85": { city: "Cascavel", state: "PR", neighborhood: "Centro", street: "Rua Paraná" },
  "86": { city: "Londrina", state: "PR", neighborhood: "Centro", street: "Rua Sergipe" },
  "88": { city: "Florianópolis", state: "SC", neighborhood: "Centro", street: "Rua Felipe Schmidt" },
  "89": { city: "Blumenau", state: "SC", neighborhood: "Centro", street: "Rua XV de Novembro" },
  "90": { city: "Porto Alegre", state: "RS", neighborhood: "Centro Histórico", street: "Rua dos Andradas" },
  "91": { city: "Porto Alegre", state: "RS", neighborhood: "Sarandi", street: "Av. Assis Brasil" },
  "95": { city: "Caxias do Sul", state: "RS", neighborhood: "Centro", street: "Rua Sinimbu" },
};

const DEFAULT_ENTRY: CepEntry = { city: "Cidade Exemplo", state: "SP", neighborhood: "Centro", street: "Rua Exemplo" };

export function lookupCep(cep: string): CepEntry | null {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  return CEP_CITY_MAP[clean.slice(0, 2)] ?? DEFAULT_ENTRY;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function simulateFreight(cep: string): Promise<FreightOption[]> {
  const clean = cep.replace(/\D/g, "");
  const seed = parseInt(clean.slice(-4) || "1234", 10);
  const r = pseudoRandom(seed);

  const options: FreightOption[] = [
    {
      id: "sedex",
      carrier: "Correios",
      service: "SEDEX",
      price: Math.round((45 + r * 40) * 100) / 100,
      currency: "BRL",
      deliveryDays: 3 + Math.floor(r * 3),
    },
    {
      id: "pac",
      carrier: "Correios",
      service: "PAC",
      price: Math.round((25 + r * 20) * 100) / 100,
      currency: "BRL",
      deliveryDays: 7 + Math.floor(r * 6),
    },
    {
      id: "jadlog",
      carrier: "Jadlog",
      service: ".Package",
      price: Math.round((35 + r * 25) * 100) / 100,
      currency: "BRL",
      deliveryDays: 4 + Math.floor(r * 4),
    },
    {
      id: "nxinlog",
      carrier: "NxinLog",
      service: "Premium",
      price: Math.round((55 + r * 40) * 100) / 100,
      currency: "BRL",
      deliveryDays: 2 + Math.floor(r * 2),
    },
    {
      id: "seller",
      carrier: "Vendedor",
      service: "Frete por conta do vendedor",
      price: 0,
      currency: "BRL",
      deliveryDays: 0,
    },
  ];

  return new Promise((resolve) => setTimeout(() => resolve(options), 800));
}
