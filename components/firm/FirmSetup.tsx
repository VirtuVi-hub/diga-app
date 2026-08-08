"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFirm, joinFirmByCode } from "@/lib/actions/firm-actions";
import type { OnboardingRole } from "@/lib/types/firm";

/** Module 2: Create Firm / Join Firm (invite code placeholder). */
export function FirmSetup({ roles }: { roles: OnboardingRole[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [inviteCode, setInviteCode] = useState("");
  // Sprint 5.9, Module 6: "Owner"/"Lead Architect" are both auto-granted-only
  // at the Firm level — never assigned to someone joining via invite code.
  const memberRole = roles.find((role) => role.name !== "Owner" && role.name !== "Lead Architect") ?? roles[0];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createFirm({ name, website: website || undefined, city: city || undefined, country: country || undefined });
      router.push("/firm");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create Firm.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!memberRole) {
      setError("No roles are available yet.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await joinFirmByCode(inviteCode, memberRole.id);
      router.push("/firm");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join Firm.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text-primary">Set Up Your Firm</h1>
      <p className="mt-1 text-text-secondary">Create a new Firm, or join one you&apos;ve been invited to.</p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("create")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${tab === "create" ? "bg-accent-primary text-white" : "bg-surface-tertiary text-text-secondary"}`}
        >
          Create Firm
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${tab === "join" ? "bg-accent-primary text-white" : "bg-surface-tertiary text-text-secondary"}`}
        >
          Join Firm
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-error">{error}</p>}

      {tab === "create" ? (
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Firm Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-text-primary outline-none"
              placeholder="Studio Meridian Architects"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-text-primary outline-none"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-text-primary outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 text-text-primary outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Firm"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Invite Code</label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              className="w-full rounded-xl border border-border-subtle bg-surface-secondary px-4 py-3 uppercase text-text-primary outline-none"
              placeholder="ABCD-EFGH"
            />
            <p className="mt-1 text-xs text-text-tertiary">Ask whoever invited you for their Firm&apos;s invite code (Module 2 — no real email delivery yet, codes are shared manually).</p>
          </div>

          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join Firm"}
          </button>
        </form>
      )}
    </div>
  );
}
