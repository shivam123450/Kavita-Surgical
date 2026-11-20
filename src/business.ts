export interface SocialLink {
  name: "Instagram" | "Facebook" | "LinkedIn";
  href: string | null;
}

export const business = {
  name: "Kavita Surgical",
  gstin: "27AFNPV6299Q1ZX",
  phone: "+918425019124",
  phoneDisplay: "+91 8425019124",
  whatsappNumber: "918425019124",
  address:
    "Jai Hind Chawl, Gandhi Nagar, Kurar Village, Malad East, Mumbai, Maharashtra 400097, India.",
  addressLines: [
    "Jai Hind Chawl, Gandhi Nagar, Kurar Village,",
    "Malad East, Mumbai, Maharashtra 400097, India.",
  ],
};

export function getDirectionsUrl(address = business.address): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function normalizeWhatsAppNumber(value: string): string {
  const input = value.trim();
  if (!input) return "";
  let number = input;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "wa.me") return "";
    number = url.pathname.replace(/^\/+/, "");
  } catch {
    if (!/^\+?[\d\s()-]+$/.test(input)) return "";
  }
  const digits = number.replace(/\D/g, "");
  return /^\d{7,15}$/.test(digits) ? digits : "";
}

// Add verified profile URLs here; links remain hidden until an account is provided.
export const socialLinks: SocialLink[] = [
  { name: "Instagram", href: null },
  { name: "Facebook", href: null },
  { name: "LinkedIn", href: null },
];
