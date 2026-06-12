export type MixRecordsFilterValues = {
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  applicatorId?: string;
  productId?: string;
  page?: string;
};

export function buildFilterHref(filters: MixRecordsFilterValues): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
