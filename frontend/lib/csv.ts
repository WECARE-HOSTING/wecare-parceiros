/**
 * Exporta um array de objetos para CSV e dispara o download no browser.
 */
export function exportCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (!data.length) return;

  const cols = columns ?? (Object.keys(data[0]) as (keyof T)[]).map((k) => ({ key: k, label: String(k) }));

  const escape = (val: unknown): string => {
    const s = val == null ? "" : String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = cols.map((c) => escape(c.label)).join(",");
  const rows = data.map((row) => cols.map((c) => escape(row[c.key])).join(","));
  const csv = [header, ...rows].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
