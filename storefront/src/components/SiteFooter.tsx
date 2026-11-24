import Image from "next/image";
import Link from "next/link";
import { getLiveCampaign } from "../lib/homepage";
import { getNavCategories } from "../lib/medusa";
import { mapsHref, site, telHref, whatsappHref } from "../lib/site";

const heading =
  "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-mustard";

export async function SiteFooter() {
  const [categories, campaign] = await Promise.all([
    getNavCategories(),
    getLiveCampaign(),
  ]);

  return (
    <footer className="mt-auto border-t border-white/10 bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4 md:px-6">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="mb-3 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt=""
              width={44}
              height={44}
              aria-hidden
              className="h-11 w-11 rounded-full object-cover ring-1 ring-mustard/40"
            />
            <div>
              <p className="font-display text-lg text-mustard">{site.name}</p>
              <p className="text-xs text-cream/55">{site.tagline}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-cream/70">
            Everything for the home from OTC Wholesale Mall. Collect in person or we deliver across
            Nairobi.
          </p>
          <a
            href={whatsappHref}
            className="mt-4 inline-flex rounded-full bg-[#25d366] px-4 py-2 text-sm font-semibold text-[#083216]"
          >
            Chat on WhatsApp
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:contents">
          <div>
            <h2 className={heading}>Shop</h2>
            <ul className="space-y-2 text-sm text-cream/75">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className="hover:text-mustard">
                    {cat.label}
                  </Link>
                </li>
              ))}
              <li>
                {campaign ? (
                  <Link href="/deals" className="font-semibold text-mustard hover:underline">
                    {campaign.name} deals
                  </Link>
                ) : (
                  <Link href="/#offers" className="hover:text-mustard">
                    Offers
                  </Link>
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className={heading}>Help</h2>
            <ul className="space-y-2 text-sm text-cream/75">
              <li>
                <Link href="/orders" className="hover:text-mustard">
                  Track an order
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-mustard">
                  My account
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-mustard">
                  Bag
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h2 className={heading}>Visit</h2>
          <address className="text-sm not-italic leading-relaxed text-cream/75">
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-mustard"
            >
              {site.address}
            </a>
            <br />
            {site.hours}
            <br />
            {site.phones.map((p, i) => (
              <span key={p}>
                {i > 0 && " · "}
                <a href={telHref(p)} className="hover:text-mustard">
                  {p}
                </a>
              </span>
            ))}
            <br />
            <a href={`mailto:${site.email}`} className="hover:text-mustard">
              {site.email}
            </a>
          </address>
          <p className="mt-4 text-xs text-cream/50">
            M-Pesa · Delivery by area fee · Free collection
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-cream/45 md:px-6">
          © {new Date().getFullYear()} {site.name}. Nairobi, Kenya.
        </p>
      </div>
    </footer>
  );
}
