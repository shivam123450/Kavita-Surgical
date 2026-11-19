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
} as const;

export const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`;

// Add verified profile URLs here; links remain hidden until an account is provided.
export const socialLinks: SocialLink[] = [
  { name: "Instagram", href: null },
  { name: "Facebook", href: null },
  { name: "LinkedIn", href: null },
];
