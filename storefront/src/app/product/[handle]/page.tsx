import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToBagButton } from "../../../components/AddToBagButton";
import { ProductCard } from "../../../components/ProductCard";
import { CountdownText } from "../../../components/Countdown";
import { ProductGallery } from "../../../components/ProductGallery";
import { getLiveCampaign } from "../../../lib/homepage";
import { getProductByHandle, listProducts } from "../../../lib/medusa";
import type { MedusaProduct } from "../../../lib/medusa-types";
import { isPriceListSale } from "../../../lib/money";
import { whatsappHref } from "../../../lib/site";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  try {
    const product = await getProductByHandle(handle);
    if (!product) return { title: "Product not found" };
    const description =
      product.description?.slice(0, 160) ||
      `Buy ${product.title} from Photon Merchants, Nairobi.`;
    const image = product.thumbnail || product.images?.[0]?.url;
    return {
      title: product.title,
      description,
      openGraph: {
        title: product.title,
        description,
        images: image ? [{ url: image }] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;

  let product: MedusaProduct | null = null;
  try {
    product = await getProductByHandle(handle);
  } catch {
    product = null;
  }

  if (!product) notFound();

  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.thumbnail
        ? [{ url: product.thumbnail }]
        : [];
  const category = product.categories?.[0];
  const campaign = await getLiveCampaign();
  const isDeal = isPriceListSale(product.variants?.[0]);
  let related: Awaited<ReturnType<typeof listProducts>>["products"] = [];
  if (category?.id) {
    try {
      const result = await listProducts({ categoryId: category.id, limit: 5 });
      related = result.products.filter((p) => p.id !== product.id).slice(0, 4);
    } catch {
      related = [];
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-28 md:px-6 md:pb-10">
      <p className="text-sm text-cream/50">
        <Link href="/" className="hover:text-mustard">
          Home
        </Link>
        {category && (
          <>
            {" / "}
            <Link href={`/category/${category.handle}`} className="hover:text-mustard">
              {category.name}
            </Link>
          </>
        )}
        {" / "}
        {product.title}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <ProductGallery title={product.title} images={images} />

        <div>
          {isDeal && campaign && (
            <Link
              href="/deals"
              className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-mustard/40 bg-mustard/10 px-4 py-3 text-sm hover:border-mustard"
            >
              <span className="font-semibold uppercase tracking-[0.14em] text-mustard">
                {campaign.badge} price
              </span>
              {campaign.ends_at && (
                <span className="text-cream/75">
                  Ends in <CountdownText endsAt={campaign.ends_at} />
                </span>
              )}
              <span className="ml-auto text-mustard underline-offset-2 hover:underline">
                More deals
              </span>
            </Link>
          )}
          <h1 className="font-display text-4xl text-cream md:text-5xl">{product.title}</h1>
          {product.description && (
            <p className="mt-4 max-w-lg text-base leading-relaxed text-cream/70">
              {product.description}
            </p>
          )}
          <div className="mt-8">
            <AddToBagButton product={product} />
          </div>

          <ul className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10 bg-ink-soft text-sm">
            <li className="px-4 py-3">
              <p className="font-semibold text-cream">Pay with M-Pesa</p>
              <p className="mt-0.5 text-cream/60">
                Approve the prompt on your phone at checkout.
              </p>
            </li>
            <li className="px-4 py-3">
              <p className="font-semibold text-cream">Delivery across Nairobi</p>
              <p className="mt-0.5 text-cream/60">
                Fee depends on your area — you’ll see it before paying.
              </p>
            </li>
            <li className="px-4 py-3">
              <p className="font-semibold text-cream">Or collect for free</p>
              <p className="mt-0.5 text-cream/60">
                OTC Mall, 1st floor, B77 &amp; C80 · Mon–Sat 7am–7pm
              </p>
            </li>
          </ul>
          <a
            href={`${whatsappHref}?text=${encodeURIComponent(`Hi Photon, I’m asking about: ${product.title}`)}`}
            className="mt-4 inline-flex text-sm text-mustard hover:underline"
          >
            Ask about this on WhatsApp
          </a>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14 border-t border-white/10 pt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl text-cream md:text-3xl">
              More in {category?.name}
            </h2>
            <Link
              href={`/category/${category?.handle}`}
              className="shrink-0 text-sm text-mustard hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} dealBadge={campaign?.badge} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
