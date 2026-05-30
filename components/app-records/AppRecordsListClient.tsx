"use client";

import Link from "next/link";

import { softDeleteAppRecordAction } from "@/app/(app)/app-records/actions";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AppRecordListItem = {
  id: string;
  job_date: string;
  customer_name: string;
  job_site_id: string | null;
  applicator_name: string;
  acres_treated: number | null;
  app_method: string | null;
};

type AppRecordsListClientProps = {
  records: AppRecordListItem[];
};

function formatMethod(method: string | null): string {
  if (!method) return "—";
  return method
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function AppRecordsListClient({ records }: AppRecordsListClientProps) {
  if (!records.length) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No application records yet. Create your first record to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Job/Site ID</th>
              <th className="px-4 py-3 font-medium">Applicator</th>
              <th className="px-4 py-3 font-medium">Acres Treated</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t">
                <td className="px-4 py-3">{record.job_date}</td>
                <td className="px-4 py-3">{record.customer_name}</td>
                <td className="px-4 py-3">{record.job_site_id || "—"}</td>
                <td className="px-4 py-3">{record.applicator_name}</td>
                <td className="px-4 py-3">{record.acres_treated ?? "—"}</td>
                <td className="px-4 py-3">{formatMethod(record.app_method)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/app-records/${record.id}`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      View
                    </Link>
                    <Link
                      href={`/app-records/${record.id}/edit`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      Edit
                    </Link>
                    <form action={softDeleteAppRecordAction.bind(null, record.id)}>
                      <ConfirmSubmitButton
                        size="sm"
                        variant="destructive"
                        confirmMessage={`Delete application record for ${record.customer_name} on ${record.job_date}?`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {records.map((record) => (
          <Card key={record.id}>
            <CardContent className="p-4">
              <div className="space-y-1">
                <h2 className="font-medium">{record.job_date}</h2>
                <p className="text-sm text-muted-foreground">{record.customer_name}</p>
                <p className="text-sm text-muted-foreground">Job/Site: {record.job_site_id || "—"}</p>
                <p className="text-sm text-muted-foreground">Applicator: {record.applicator_name}</p>
                <p className="text-sm text-muted-foreground">
                  Acres: {record.acres_treated ?? "—"} · Method: {formatMethod(record.app_method)}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/app-records/${record.id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  View
                </Link>
                <Link
                  href={`/app-records/${record.id}/edit`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Edit
                </Link>
                <form action={softDeleteAppRecordAction.bind(null, record.id)}>
                  <ConfirmSubmitButton
                    size="sm"
                    variant="destructive"
                    confirmMessage={`Delete application record for ${record.customer_name} on ${record.job_date}?`}
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
