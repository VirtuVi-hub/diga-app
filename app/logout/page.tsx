"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/supabase/browser";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function signOut() {
      const supabase = createBrowserSupabaseClient();

      await supabase.auth.signOut();

      router.replace("/auth");
    }

    signOut();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-primary text-text-primary">
      <p className="text-lg">Signing you out...</p>
    </main>
  );
}