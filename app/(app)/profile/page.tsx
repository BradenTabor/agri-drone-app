import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { updateProfileAction } from "./actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,license_cert_no,phone,email")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your name and license number auto-fill the applicator details on new mix records.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <ProfileForm
            action={updateProfileAction}
            email={profile?.email ?? user.email ?? ""}
            defaultValues={{
              fullName: profile?.full_name ?? null,
              licenseCertNo: profile?.license_cert_no ?? null,
              phone: profile?.phone ?? null,
            }}
          />
        </CardContent>
      </Card>
    </section>
  );
}
