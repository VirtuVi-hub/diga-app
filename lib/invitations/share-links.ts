/**
 * Sprint 5.7, Module 6, revised Sprint 5.8 Modules 1-2: "Project
 * invitations should primarily support WhatsApp sharing... Support
 * WhatsApp, Copy Link, SMS, Email (optional)." No real delivery
 * infrastructure exists (or is planned) — these remain client-constructed
 * deep links around a copy-able invite URL, the same scope
 * `firm_invitations`' on-screen code already has. Pure, client-safe (no
 * server import), so it can be called directly from a "use client"
 * component.
 *
 * Post-launch fix: previously preferred a build-time `NEXT_PUBLIC_APP_URL`
 * constant over `window.location.origin`, reasoning that the origin the
 * Lead Architect happens to be browsing from (a reverse proxy or tunnel
 * hostname) shouldn't leak into a shared link. In practice this codebase's
 * deploy process doesn't reliably guarantee that constant is correct at
 * build time — it has repeatedly shipped a stale local tunnel URL baked
 * into production, silently, for however long until the next correct
 * rebuild. `window.location.origin` can never go stale like that: it's
 * read live, every time, from wherever this code is actually running —
 * correct on `next dev`, every Vercel preview, production, and any custom
 * domain, with nothing to configure or keep in sync. This function is only
 * ever called from a "use client" component, so `window` is always
 * available here.
 *
 * Sprint 5.8, Module 2: WhatsApp now deep-links straight to the invitee's
 * own number (`https://wa.me/<digits>?text=...`) instead of the generic
 * `https://wa.me/?text=...` compose screen, since the number is now a
 * required field collected before the invitation is created. Every
 * channel here still funnels through this one function — swapping in a
 * real WhatsApp Business API provider later means changing this file
 * only, not every call site.
 */
export function buildInviteShareLinks(params: { inviteCode: string; projectName: string; roleName: string; inviteeName?: string | null; whatsappNumber?: string | null }) {
  const baseUrl = typeof window !== "undefined" && window.location && window.location.origin ? window.location.origin : "";
  const url = `${baseUrl}/invite/${params.inviteCode}`;

  const greeting = params.inviteeName?.trim() ? `Hi ${params.inviteeName.trim()}, ` : "";
  const message = `${greeting}you've been invited to join "${params.projectName}" on Delta as ${params.roleName}. ${url}`;

  const whatsappDigits = params.whatsappNumber?.replace(/[^\d]/g, "") ?? "";

  return {
    url,
    whatsapp: `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`,
    sms: `sms:${params.whatsappNumber ?? ""}?body=${encodeURIComponent(message)}`,
    email: `mailto:?subject=${encodeURIComponent(`Invitation to ${params.projectName}`)}&body=${encodeURIComponent(message)}`,
  };
}
