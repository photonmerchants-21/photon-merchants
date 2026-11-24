export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="h-10 w-48 animate-pulse rounded bg-white/10" />
      <div className="mt-4 h-4 w-72 max-w-full animate-pulse rounded bg-white/5" />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] animate-pulse rounded-2xl bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}
