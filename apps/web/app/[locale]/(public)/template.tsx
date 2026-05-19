"use client";

import { PublicPageTemplate } from "./public-page-template";

export default function PublicLayoutTemplate({ children }: { children: React.ReactNode }) {
  return <PublicPageTemplate>{children}</PublicPageTemplate>;
}
