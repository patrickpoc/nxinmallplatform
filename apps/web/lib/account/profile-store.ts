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

const PROFILE_KEY_PREFIX = "nxin_profile:";
const ADDRESS_KEY_PREFIX = "nxin_address:";

function profileKey(userId: string): string {
  return `${PROFILE_KEY_PREFIX}${userId}`;
}

function addressKey(userId: string): string {
  return `${ADDRESS_KEY_PREFIX}${userId}`;
}

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

export function saveProfile(userId: string, data: SavedProfile): void {
  writeJson(profileKey(userId), data);
}

export function loadProfile(userId: string): SavedProfile | null {
  return readJson<SavedProfile>(profileKey(userId));
}

export function saveAddress(userId: string, data: SavedAddress): void {
  writeJson(addressKey(userId), data);
}

export function loadAddress(userId: string): SavedAddress | null {
  return readJson<SavedAddress>(addressKey(userId));
}
