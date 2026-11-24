import Link from "next/link";
import { getNavCategories } from "../lib/medusa";

export default async function NotFound() {
  const categories = await getNavCategories();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start px-4 py-16 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-mustard">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl text-cream">Page not found</h1>
      <p className="mt-3 text-cream/65">
        That link doesn’t match anything in the shop. Try home or a category.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-full bg-mustard px-5 py-3 text-sm font-semibold text-ink hover:bg-mustard-bright"
        >
          Home
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="rounded-full border border-white/20 px-5 py-3 text-sm text-cream hover:border-mustard/50"
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
