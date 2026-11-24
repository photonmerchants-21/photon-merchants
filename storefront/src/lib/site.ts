export const site = {
  name: "Photon Merchants",
  tagline: "Offering quality and comfort",
  email: "photonmerchant@gmail.com",
  phones: ["0748 908 954", "0748 661 186"],
  /** Primary WhatsApp for the site chat button — confirm with client if this should change. */
  whatsapp: "254748908954",
  whatsappDisplay: "0748 908 954",
  address: "Nairobi OTC Wholesale Mall, 1st floor, shops B77 & C80",
  hours: "Monday–Saturday · 7:00am–7:00pm",
  /** Fallback when Medusa is unreachable; the live list comes from product categories. */
  categories: [
    { slug: "kitchen-dining", label: "Kitchen & Dining" },
    { slug: "appliances", label: "Appliances" },
    { slug: "storage-organisation", label: "Storage & Organisation" },
    { slug: "bedroom-bedding", label: "Bedroom & Bedding" },
    { slug: "bathroom", label: "Bathroom" },
    { slug: "home-decor", label: "Home Decor" },
    { slug: "cleaning-laundry", label: "Cleaning & Laundry" },
    { slug: "tech-electronics", label: "Tech & Electronics" },
  ],
} as const;

export type NavCategory = {
  slug: string;
  label: string;
  description?: string | null;
  image?: string | null;
};

export const whatsappHref = `https://wa.me/${site.whatsapp}`;

export const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("OTC Wholesale Mall, Nairobi")}`;

export function telHref(display: string) {
  return `tel:+254${display.replace(/\D/g, "").replace(/^0/, "")}`;
}
