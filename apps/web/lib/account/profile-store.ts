import type { DocType } from "@/lib/cart/checkout-types";

export type SavedProfile = {
  name: string;
  email: string;
  phone: string;
  docType: DocType;
  cpfCnpj: string;
  whatsapp: string;
  profiles: string[];
};

export type SavedAddress = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

const PROFILE_KEY = "nxin_profile";
const ADDRESS_KEY = "nxin_address";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function saveProfile(data: SavedProfile): void {
  writeJson(PROFILE_KEY, data);
}

export function loadProfile(): SavedProfile | null {
  return readJson<SavedProfile>(PROFILE_KEY);
}

export function saveAddress(data: SavedAddress): void {
  writeJson(ADDRESS_KEY, data);
}

export function loadAddress(): SavedAddress | null {
  return readJson<SavedAddress>(ADDRESS_KEY);
}
