export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 aspect-[16/9] w-full animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-32 w-full animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
