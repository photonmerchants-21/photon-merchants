import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Analytics } from "../components/Analytics";
import { CampaignBar } from "../components/CampaignBar";
import { MobileNav } from "../components/MobileNav";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { AuthProvider } from "../lib/auth";
import { BagProvider } from "../lib/bag";
import { getLiveCampaign } from "../lib/homepage";
import { site } from "../lib/site";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3001";

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: `${site.tagline}. Shop kitchen, appliances, bedding, bathroom, decor, and tech from OTC Wholesale Mall, Nairobi. Pay with M-Pesa. Collect or delivery.`,
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: site.name,
    title: site.name,
    description: `${site.tagline}. Homeware, appliances, and tech — Nairobi OTC.`,
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.tagline,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const campaign = await getLiveCampaign();

  return (
    <html lang="en-KE">
      <body
        className={`${sans.variable} ${display.variable} flex min-h-screen flex-col bg-ink font-sans text-cream antialiased`}
      >
        <AuthProvider>
          <BagProvider>
            {campaign && (
              <CampaignBar name={campaign.name} endsAt={campaign.ends_at} />
            )}
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
              <SiteFooter />
            </div>
            <MobileNav />
            <Analytics />
          </BagProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
