type BoothContact = {
  quotationUrl?: string | null;
  whatsappNumber?: string | null;
  phone?: string | null;
};

/** Priority: custom URL > WhatsApp > phone tel: link */
export function getQuotationHref(booth: BoothContact): string | null {
  const url = booth.quotationUrl?.trim();
  if (url) return url;

  const wa = booth.whatsappNumber?.replace(/\D/g, "");
  if (wa) return `https://wa.me/${wa}`;

  const phone = booth.phone?.replace(/\D/g, "");
  if (phone) return `tel:+${phone.startsWith("55") ? phone : `55${phone}`}`;

  return null;
}
