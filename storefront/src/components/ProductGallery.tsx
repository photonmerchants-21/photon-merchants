"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = { url: string };

export function ProductGallery({
  title,
  images,
}: {
  title: string;
  images: GalleryImage[];
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-ink-soft">
        {current ? (
          <Image
            src={current.url}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-cream/40">
            No image
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 8).map((img, i) => {
            const selected = i === active;
            return (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={selected}
                className={`relative aspect-square overflow-hidden rounded-lg border transition ${
                  selected
                    ? "border-mustard ring-1 ring-mustard"
                    : "border-white/10 hover:border-mustard/50"
                }`}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
