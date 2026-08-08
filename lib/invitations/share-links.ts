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
 * Sprint 5.8, Module 1: the base URL is `NEXT_PUBLIC_APP_URL` (inlined at
 * build time into the client bundle, same as every other `NEXT_PUBLIC_*`
 * variable in this codebase) — never `window.location.origin`. A link
 * generated from `window.location.origin` happens to look right for
 * whichever origin the Lead Architect is currently on, but isn't the
 * single source of truth Module 1 asks for (a reverse proxy or tunnel
 * hostname can differ from the one that should actually be shared) and
 * silently falls apart for any future non-browser caller. Falls back to
 * `window.location.origin` only if the env var is genuinely unset, so a
 * misconfigured environment still produces a working (if unendorsed) link
 * rather than a broken one.
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
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const baseUrl = configuredBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
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
