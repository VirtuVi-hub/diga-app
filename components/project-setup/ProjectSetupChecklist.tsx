"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { activateProjectAction, saveSetupQuestionnaireAnswer, getProjectSetupContext } from "@/lib/actions/project-setup-actions";
import { removeProjectMember } from "@/lib/actions/project-actions";
import { revokeProjectInvitation } from "@/lib/actions/project-invitation-actions";
import { AddParticipantFlow } from "@/components/participants/AddParticipantFlow";
import { InviteShareSheet } from "@/components/invitations/InviteShareSheet";
import { toDisplayRoleName } from "@/lib/roles/display-role-name";
import { sectionRoleNames, type ParticipantSection as ParticipantSectionKey } from "@/lib/participants/role-categories";
import { SETUP_QUESTIONNAIRE_QUESTIONS, type ChecklistItem } from "@/lib/types/project-setup";

type SetupContext = Awaited<ReturnType<typeof getProjectSetupContext>>;

/**
 * Sprint 5.9.2: onboarding items are never gates — this is the one place
 * that maps each of the 6 real, optional onboarding steps to the concrete
 * action a Lead Architect can take right now (open the relevant section
 * on this same page, or navigate to Import/Delta Review), reused both by
 * the pre-activation section badges and the post-activation "Recommended
 * Next Steps" list, so the two never drift apart.
 */
const ONBOARDING_ACTIONS: Record<string, { recommendationLabel: string; sectionKey?: string; href?: string }> = {
  design_team: { recommendationLabel: "Invite Design Team", sectionKey: "design_team" },
  consultants: { recommendationLabel: "Invite Consultants", sectionKey: "consultants" },
  client_representatives: { recommendationLabel: "Invite Client Representatives", sectionKey: "client_representatives" },
  import: { recommendationLabel: "Import Existing Project" },
  questionnaire: { recommendationLabel: "Complete Client Questionnaire", sectionKey: "questionnaire" },
  review: { recommendationLabel: "Review Delta Understanding" },
};

function doneFor(checklist: ChecklistItem[] | undefined, key: string): boolean {
  return checklist?.find((item) => item.key === key)?.done ?? false;
}

/**
 * Sprint 5.9.2: Project Activation reflects the real lifecycle of an
 * architectural project — Agreement Approved, Lead Architect, and Main
 * Client are the ONLY conditions that gate anything. Design Team,
 * Consultants, Client Representatives, Import, Client Questionnaire, and
 * Delta Review are real, optional onboarding: always visible, always
 * actionable, never blocking — before or after activation. Once the
 * project is Active, this page continues to exist as an onboarding page,
 * and every incomplete item becomes a "Recommended Next Step" instead of
 * a checklist entry.
 */
export function ProjectSetupChecklist({ projectId, context }: { projectId: string; context: SetupContext }) {
  const router = useRouter();
  const progress = context.setupProgress;
  const isActive = context.project?.lifecycle_stage === "active";

  const [openSection, setOpenSection] = useState<string | null>("design_team");

  function refresh() {
    router.refresh();
  }

  function openAndScrollTo(sectionKey: string) {
    setOpenSection(sectionKey);
    document.getElementById(`setup-section-${sectionKey}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <ActivationPanel projectId={projectId} progress={progress} isActive={isActive} onActivated={refresh} />

      <div className="mt-6 space-y-3">
        <div id="setup-section-design_team">
          <ParticipantSectionCard
            sectionKey="design_team"
            title="Design Team"
            description="Architects, designers, and the rest of the internal design team. The Lead Architect who created this project is already assigned."
            done={doneFor(progress?.onboarding, "design_team")}
            open={openSection === "design_team"}
            onToggle={() => setOpenSection(openSection === "design_team" ? null : "design_team")}
            projectId={projectId}
            projectName={context.project?.name ?? ""}
            context={context}
            onDone={refresh}
          />
        </div>

        <div id="setup-section-consultants">
          <ParticipantSectionCard
            sectionKey="consultants"
            title="Consultants"
            description="Structural, MEP, landscape, and other external consultants — optional, and often appointed well after the project starts."
            done={doneFor(progress?.onboarding, "consultants")}
            open={openSection === "consultants"}
            onToggle={() => setOpenSection(openSection === "consultants" ? null : "consultants")}
            projectId={projectId}
            projectName={context.project?.name ?? ""}
            context={context}
            onDone={refresh}
          />
        </div>

        <div id="setup-section-client_representatives">
          <ParticipantSectionCard
            sectionKey="client_representatives"
            title="Client Representatives"
            description="Optional. Client Representatives do not automatically receive approval authority — only the Main Client does, unless explicitly delegated."
            done={doneFor(progress?.onboarding, "client_representatives")}
            open={openSection === "client_representatives"}
            onToggle={() => setOpenSection(openSection === "client_representatives" ? null : "client_representatives")}
            projectId={projectId}
            projectName={context.project?.name ?? ""}
            context={context}
            onDone={refresh}
          />
        </div>

        <SectionShell
          title="Import Existing Project"
          description="Bring in existing documents, drawings, and records — whenever they become available."
          badge={doneFor(progress?.onboarding, "import") ? "Done" : "Pending"}
          open={openSection === "import"}
          onToggle={() => setOpenSection(openSection === "import" ? null : "import")}
        >
          <Link href={`/projects/${projectId}/import`} className="inline-block rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white">
            Open Import
          </Link>
        </SectionShell>

        <div id="setup-section-questionnaire">
          <QuestionnaireSection projectId={projectId} context={context} done={doneFor(progress?.onboarding, "questionnaire")} open={openSection === "questionnaire"} onToggle={() => setOpenSection(openSection === "questionnaire" ? null : "questionnaire")} />
        </div>

        <SectionShell
          title="Delta Review"
          description="Confirm Delta's understanding of the project — optional, and never required for activation."
          badge={doneFor(progress?.onboarding, "review") ? "Done" : "Pending"}
          open={openSection === "review"}
          onToggle={() => setOpenSection(openSection === "review" ? null : "review")}
        >
          <Link href={`/projects/${projectId}/setup/review`} className="inline-block rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white">
            Review
          </Link>
        </SectionShell>
      </div>

      {progress && (
        <div className="mt-8">
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Onboarding Progress</span>
            <span>{progress.onboarding.filter((item) => item.done).length} / {progress.onboarding.length} Complete</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-surface-tertiary">
            <div className="h-2 rounded-full bg-accent-primary" style={{ width: `${progress.onboardingPercentComplete}%` }} />
          </div>
          <p className="mt-2 text-xs text-text-tertiary">Onboarding is optional — none of these steps block project activation or day-to-day work.</p>

          {isActive && <RecommendedNextSteps projectId={projectId} onboarding={progress.onboarding} onOpenSection={openAndScrollTo} />}
        </div>
      )}
    </div>
  );
}

/**
 * Sprint 5.9.2: the ONLY gating logic left anywhere in Project Setup.
 * Shows exactly the 3 mandatory conditions (Agreement Approved / Lead
 * Architect / Main Client); the moment all 3 are true, "Activate Project"
 * appears — never blocked by Consultants, Design Team, Client
 * Representatives, Import, Questionnaire, or Delta Review. Once the
 * project is Active, this becomes a simple status confirmation instead.
 */
function ActivationPanel({ projectId, progress, isActive, onActivated }: { projectId: string; progress: SetupContext["setupProgress"]; isActive: boolean; onActivated: () => void }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function activate() {
    setError("");
    startTransition(async () => {
      try {
        await activateProjectAction(projectId);
        onActivated();
      } catch (activateError) {
        setError(activateError instanceof Error ? activateError.message : "Failed to activate the project.");
      }
    });
  }

  if (isActive) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 px-6 py-5">
        <p className="font-display text-lg font-semibold text-text-primary">Project Active</p>
        <p className="mt-1 text-sm text-text-secondary">Agreement approved, Lead Architect assigned, Main Client assigned. The collaborative workspace is unlocked.</p>
      </div>
    );
  }

  const readyToActivate = progress?.readyToActivate ?? false;

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-secondary px-6 py-5">
      <p className="font-display text-lg font-semibold text-text-primary">Project Activation</p>
      <p className="mt-1 text-sm text-text-secondary">Only these three conditions are required — nothing else blocks activation.</p>

      <ul className="mt-4 space-y-2">
        {(progress?.mandatory ?? []).map((item) => (
          <li key={item.key} className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-sm">
            <span className="text-text-primary">{item.label}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.done ? "bg-success/15 text-success" : "bg-surface-tertiary text-text-tertiary"}`}>{item.done ? "Done" : "Pending"}</span>
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <div className="mt-4 rounded-xl bg-surface-tertiary px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Next Action</p>
        {readyToActivate ? (
          <>
            <p className="mt-1 text-sm font-medium text-text-primary">Activate Project</p>
            <button type="button" onClick={activate} disabled={isPending} className="mt-3 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              {isPending ? "Activating..." : "Activate Project"}
            </button>
          </>
        ) : (
          <p className="mt-1 text-sm font-medium text-text-primary">Waiting on: {(progress?.mandatory ?? []).find((item) => !item.done)?.label ?? "the remaining condition"}.</p>
        )}
      </div>
    </div>
  );
}

/** Sprint 5.9.2: after activation, incomplete onboarding items become recommendations — never a checklist blocking anything. */
function RecommendedNextSteps({ projectId, onboarding, onOpenSection }: { projectId: string; onboarding: ChecklistItem[]; onOpenSection: (sectionKey: string) => void }) {
  const incomplete = onboarding.filter((item) => !item.done);
  if (incomplete.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-secondary p-6">
      <h2 className="font-display text-lg font-semibold text-text-primary">Recommended Next Steps</h2>
      <ul className="mt-3 space-y-2">
        {incomplete.map((item) => {
          const action = ONBOARDING_ACTIONS[item.key];
          return (
            <li key={item.key} className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-sm">
              <span className="text-text-primary">{action?.recommendationLabel ?? item.label}</span>
              {action?.sectionKey ? (
                <button type="button" onClick={() => onOpenSection(action.sectionKey!)} className="rounded-full border border-accent-primary/40 bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary">
                  Continue
                </button>
              ) : item.key === "import" ? (
                <Link href={`/projects/${projectId}/import`} className="rounded-full border border-accent-primary/40 bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary">
                  Open Import
                </Link>
              ) : (
                <Link href={`/projects/${projectId}/setup/review`} className="rounded-full border border-accent-primary/40 bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary">
                  Review
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SectionShell({
  title,
  description,
  badge,
  open,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  badge: string | null;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-secondary">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between p-5 text-left">
        <div>
          <p className="font-medium text-text-primary">{title}</p>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
        {badge && <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge === "Done" ? "bg-success/15 text-success" : "bg-surface-tertiary text-text-tertiary"}`}>{badge}</span>}
      </button>
      {open && <div className="border-t border-border-subtle p-5">{children}</div>}
    </div>
  );
}

/**
 * Sprint 5.9, Module 2/3 (never gates activation as of 5.9.2): the shared
 * One Invitation Engine component. Shows who's already here (real
 * `project_team` members + real pending `project_invitations` matching
 * this section's roles) plus the Invite flow — never a passive, dead card.
 */
function ParticipantSectionCard({
  sectionKey,
  title,
  description,
  done,
  open,
  onToggle,
  projectId,
  projectName,
  context,
  onDone,
}: {
  sectionKey: ParticipantSectionKey;
  title: string;
  description: string;
  done: boolean;
  open: boolean;
  onToggle: () => void;
  projectId: string;
  projectName: string;
  context: SetupContext;
  onDone: () => void;
}) {
  const allowedNames = sectionRoleNames(sectionKey);
  const sectionMembers = useMemo(
    () => context.team.filter((member) => (allowedNames ? allowedNames.includes(member.role) || member.role === "Lead Architect" : true)),
    [context.team, allowedNames],
  );
  const sectionInvitations = useMemo(
    () => context.invitations.filter((invitation) => invitation.status === "pending" && (allowedNames ? allowedNames.includes(invitation.role_name ?? "") : true)),
    [context.invitations, allowedNames],
  );

  async function handleRemove(memberId: string) {
    await removeProjectMember(memberId);
    onDone();
  }

  async function handleRevoke(invitationId: string) {
    await revokeProjectInvitation(invitationId, projectId);
    onDone();
  }

  return (
    <SectionShell title={title} description={description} badge={done ? "Done" : "Pending"} open={open} onToggle={onToggle}>
      <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
        {sectionMembers.length === 0 && sectionInvitations.length === 0 ? (
          <li className="px-4 py-3 text-sm text-text-tertiary">No one has been added yet.</li>
        ) : (
          <>
            {sectionMembers.map((member) => (
              <li key={member.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-text-primary">{member.name}</span>
                <span className="flex items-center gap-3">
                  <span className="rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary">{toDisplayRoleName(member.role)}</span>
                  <button type="button" onClick={() => handleRemove(member.id)} className="text-xs text-text-tertiary hover:text-error">
                    Remove
                  </button>
                </span>
              </li>
            ))}
            {sectionInvitations.map((invitation) => (
              <li key={invitation.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-primary">
                    {invitation.invitee_name ?? invitation.email ?? invitation.phone ?? "Shareable link"} — <span className="text-text-tertiary">{toDisplayRoleName(invitation.role_name) || "Invited"}</span>
                  </span>
                  <button type="button" onClick={() => handleRevoke(invitation.id)} className="text-xs text-text-tertiary hover:text-error">
                    Revoke
                  </button>
                </div>
                <InviteShareSheet inviteCode={invitation.invite_code} projectName={projectName} roleName={invitation.role_name ?? "Team Member"} inviteeName={invitation.invitee_name} whatsappNumber={invitation.phone} />
              </li>
            ))}
          </>
        )}
      </ul>

      <div className="mt-4">
        <AddParticipantFlow
          projectId={projectId}
          projectName={projectName}
          section={sectionKey}
          firmMembers={context.firmMembers}
          projectRoles={context.projectRoles}
          excludePersonIds={context.team.map((member) => member.personId)}
          onDone={onDone}
        />
      </div>
    </SectionShell>
  );
}

function QuestionnaireSection({
  projectId,
  context,
  done,
  open,
  onToggle,
}: {
  projectId: string;
  context: SetupContext;
  done: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const initial = useMemo(() => {
    const map: Record<string, string> = {};
    for (const response of context.questionnaire) map[response.question_key] = response.answer_text ?? "";
    return map;
  }, [context.questionnaire]);

  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      for (const question of SETUP_QUESTIONNAIRE_QUESTIONS) {
        const text = (answers[question.key] ?? "").trim();
        if (text) {
          await saveSetupQuestionnaireAnswer(projectId, question.key, question.label, text);
        }
      }
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save the questionnaire.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionShell
      title="Client Questionnaire"
      description="Completed by the Main Client (Client Representatives may complete it only if delegated). Answers become Requirements, Constraints, Preferences, and Risks, pending Lead Architect confirmation. Optional — never required for activation."
      badge={done ? "Done" : "Pending"}
      open={open}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {SETUP_QUESTIONNAIRE_QUESTIONS.map((question) => (
          <div key={question.key}>
            <label className="mb-1 block text-sm font-medium text-text-secondary">{question.label}</label>
            <textarea
              value={answers[question.key] ?? ""}
              onChange={(event) => setAnswers((current) => ({ ...current, [question.key]: event.target.value }))}
              placeholder={question.placeholder}
              rows={2}
              className="w-full rounded-xl border border-border-subtle bg-surface-primary px-4 py-3 text-text-primary outline-none"
            />
          </div>
        ))}
        {error && <p className="text-sm text-error">{error}</p>}
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-full bg-accent-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </SectionShell>
  );
}
