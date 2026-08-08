import { redirect } from "next/navigation";
import { getFirmContext } from "@/lib/actions/firm-actions";
import { getCurrentAuthUser } from "@/lib/auth/current-person";
import { CreateProjectForm } from "@/components/project-create/CreateProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const user = await getCurrentAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const { person, firm } = await getFirmContext();

  if (!person || !firm) {
    // A Project needs a Firm to belong to — sending the user to set one up
    // first is an existence check, not permission enforcement.
    redirect("/firm");
  }

  return (
    <main className="flex-1 bg-surface-primary px-6 py-12 text-text-primary">
      <div className="mx-auto max-w-2xl">
        <CreateProjectForm firmName={firm.name} />
      </div>
    </main>
  );
}
