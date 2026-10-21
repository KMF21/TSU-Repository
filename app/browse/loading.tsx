/** Shown instantly while search results load, so navigation never feels stalled. */
export default function BrowseLoading() {
  return (
    <main className="min-h-screen bg-tsu-bg">
      <div className="border-b border-tsu-card-border">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="h-4 w-36 animate-pulse rounded bg-tsu-card" />
          <div className="mt-4 h-12 w-72 animate-pulse rounded bg-tsu-card" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="card mb-8 h-40 animate-pulse" />
        <div className="flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-44 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
