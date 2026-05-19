import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind class names without conflicts (shadcn pattern). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
