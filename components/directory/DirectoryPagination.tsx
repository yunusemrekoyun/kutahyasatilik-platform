import Link from "next/link";

export default function DirectoryPagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) =>
    target > 1 ? `${basePath}?sayfa=${target}` : basePath;
  const wanted = new Set<number>([1, totalPages]);
  for (
    let number = Math.max(1, page - 1);
    number <= Math.min(totalPages, page + 1);
    number += 1
  ) {
    wanted.add(number);
  }

  const pages: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const number of [...wanted].sort((a, b) => a - b)) {
    if (number - previous > 1) pages.push("ellipsis");
    pages.push(number);
    previous = number;
  }

  const buttonClass =
    "grid min-h-11 min-w-11 place-items-center rounded-lg px-3 text-sm font-semibold transition";

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label="Sayfalama"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className={`${buttonClass} border border-stone bg-paper text-ink hover:border-brand-300`}
        >
          Önceki
        </Link>
      ) : null}

      {pages.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${buttonClass} ${
              item === page
                ? "bg-brand-700 text-white"
                : "border border-stone bg-paper text-ink hover:border-brand-300"
            }`}
          >
            <span className="sr-only">Sayfa </span>
            {item}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className={`${buttonClass} border border-stone bg-paper text-ink hover:border-brand-300`}
        >
          Sonraki
        </Link>
      ) : null}
    </nav>
  );
}
