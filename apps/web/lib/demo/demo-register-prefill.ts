import type { RegisterPhase } from "@/lib/demo/demo-steps";

export const DEMO_REGISTER_VALUES = {
  email: "comprador.demo@agroempresa.com.br",
  password: "Demo@2024",
  confirmPassword: "Demo@2024",
  role: "BUYER" as const,
  acceptTerms: true as const,
};

export type RegisterPrefillValues = {
  email: string;
  password: string;
  confirmPassword: string;
  role: "BUYER" | "SELLER";
  acceptTerms: boolean;
};

export type RegisterPrefillHandler = (phase: RegisterPhase) => void;
