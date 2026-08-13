import { redirect } from "next/navigation";

export default function Home() {
  // TEMPORARY DEBUG INSTRUMENTATION — remove after diagnosing the redirect
  // loop report. No logic below was changed to add this.
  console.log("[invite-debug][app/page.tsx] executing, redirecting to /projects");
  redirect("/projects");
}
