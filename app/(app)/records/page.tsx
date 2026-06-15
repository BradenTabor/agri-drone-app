import Link from "next/link";

import { MixRecordsFilterPanel } from "@/components/records/MixRecordsFilterPanel";
import { MixRecordsListClient } from "@/components/records/MixRecordsListClient";
import { FormDraftResumeBanner } from "@/components/forms/FormDraftResumeBanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { buildFilterHref, type MixRecordsFilterValues } from "@/lib/records/buildFilterHref";
import { createClient } from "@/lib/supabase/server";

type RecordRow = {
  id: string;
  record_date: string;
  time_mixed: string;
  customer_name_snapshot: string | null;
  field_name_snapshot: string | null;
  signed_typed_name: string;
  total_mix_gal: number;
  expected_acres: number;
  actual_acres: number | null;
  wind_speed_mph: number;
  wind_direction: string;
  submitted_at: string;
};

type RecordsPageProps = {
  searchParams: Promise<{
    q?: string;
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
    applicatorId?: string;
    productId?: string;
    page?: string;
  }>;
};

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const filters = await searchParams;
  const pageSize = 10;
  const currentPage = Math.max(1, Number(filters.page ?? "1") || 1);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize - 1;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: customers }, { data: applicators }, { data: products }, { data: savedFilters }] =
    await Promise.all([
      supabase.from("customers").select("id,name").is("deleted_at", null).order("name", { ascending: true }),
      supabase.from("profiles").select("id,full_name,email").is("deleted_at", null).order("full_name", { ascending: true }),
      supabase.from("products").select("id,name").is("deleted_at", null).order("name", { ascending: true }),
      user
        ? supabase
            .from("saved_filters")
            .select("id,name,filters")
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .order("updated_at", { ascending: false })
            .limit(8)
        : Promise.resolve({ data: [] }),
    ]);

  let filteredIds: string[] | null = null;
  if (filters.productId) {
    const { data: productRows } = await supabase
      .from("mix_record_products")
      .select("mix_record_id,mix_records!inner(id,deleted_at)")
      .eq("product_id", filters.productId)
      .is("deleted_at", null)
      .is("mix_records.deleted_at", null);
    filteredIds = [...new Set((productRows ?? []).map((row) => row.mix_record_id))];
  }

  let query = supabase
    .from("mix_records")
    .select(
      "id,record_date,time_mixed,customer_name_snapshot,field_name_snapshot,signed_typed_name,total_mix_gal,expected_acres,actual_acres,wind_speed_mph,wind_direction,submitted_at",
    )
    .is("deleted_at", null);
  let countQuery = supabase.from("mix_records").select("id", { count: "exact", head: true }).is("deleted_at", null);

  if (filters.q) {
    query = query.textSearch("search_vector", filters.q);
    countQuery = countQuery.textSearch("search_vector", filters.q);
  }
  if (filters.dateFrom) {
    query = query.gte("record_date", filters.dateFrom);
    countQuery = countQuery.gte("record_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("record_date", filters.dateTo);
    countQuery = countQuery.lte("record_date", filters.dateTo);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
    countQuery = countQuery.eq("customer_id", filters.customerId);
  }
  if (filters.applicatorId) {
    query = query.eq("applicator_id", filters.applicatorId);
    countQuery = countQuery.eq("applicator_id", filters.applicatorId);
  }
  if (filteredIds) {
    query = filteredIds.length
      ? query.in("id", filteredIds)
      : query.eq("id", "00000000-0000-0000-0000-000000000000");
    countQuery = filteredIds.length
      ? countQuery.in("id", filteredIds)
      : countQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  const [{ data: records, error }, { count, error: countError }] = await Promise.all([
    query.order("record_date", { ascending: false }).order("submitted_at", { ascending: false }).range(startIndex, endIndex),
    countQuery,
  ]);

  if (error || countError) {
    throw new Error("Unable to load records.");
  }

  const typedRecords = (records ?? []) as RecordRow[];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const filterValues: MixRecordsFilterValues = {
    q: filters.q,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    customerId: filters.customerId,
    applicatorId: filters.applicatorId,
    productId: filters.productId,
  };

  return (
    <section className="space-y-3 sm:space-y-4">
      <PageHeader
        title="Mix Records"
        description="Review, search, and edit submitted records."
        action={
          <Link href="/records/new" className={buttonVariants()}>
            + New Mix Record
          </Link>
        }
      />

      <FormDraftResumeBanner formType="mix-record" href="/records/new" label="mix record" />

      <MixRecordsFilterPanel
        filters={filterValues}
        customers={(customers ?? []).map((customer) => ({ id: customer.id, label: customer.name }))}
        applicators={(applicators ?? []).map((applicator) => ({
          id: applicator.id,
          label: applicator.full_name || applicator.email || applicator.id,
        }))}
        products={(products ?? []).map((product) => ({ id: product.id, label: product.name }))}
        savedFilters={(savedFilters ?? []).map((savedFilter) => ({
          id: savedFilter.id,
          name: savedFilter.name,
          filters: (savedFilter.filters as MixRecordsFilterValues) ?? {},
        }))}
        totalCount={totalCount}
      />

      <MixRecordsListClient
        records={typedRecords}
        currentPage={currentPage}
        totalPages={totalPages}
        previousHref={
          hasPrev ? buildFilterHref({ ...filterValues, page: String(Math.max(1, currentPage - 1)) }) : undefined
        }
        nextHref={
          hasNext
            ? buildFilterHref({ ...filterValues, page: String(Math.min(totalPages, currentPage + 1)) })
            : undefined
        }
        emptyMessage={
          totalCount
            ? "No records match your filters."
            : "No records yet. Create your first mix record to get started."
        }
      />
    </section>
  );
}
