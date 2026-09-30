// Plain GET <form> — the browser encodes it into the URL's query string on
// submit, and the Server Component page reads it back via `searchParams`.
// No client JS needed for filtering to work.
const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const inputClass =
  "h-9 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SearchFilterBar({
  searchPlaceholder,
  searchDefault,
  filterName,
  filterLabel,
  filterOptions,
  filterDefault,
}: {
  searchPlaceholder: string;
  searchDefault?: string;
  filterName: string;
  filterLabel: string;
  filterOptions: { value: string; label: string }[];
  filterDefault?: string;
}) {
  return (
    <form method="GET" className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="q"
        placeholder={searchPlaceholder}
        defaultValue={searchDefault ?? ""}
        className={inputClass}
      />
      <select name={filterName} defaultValue={filterDefault ?? ""} className={selectClass} aria-label={filterLabel}>
        <option value="">{filterLabel} — tous</option>
        {filterOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-9 rounded-lg border border-input bg-transparent px-4 text-sm hover:bg-muted"
      >
        Filtrer
      </button>
    </form>
  );
}
