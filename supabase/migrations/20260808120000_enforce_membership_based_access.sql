-- =====================================================
-- DIGA - Enforce membership-based workspace access
-- =====================================================
-- A project is visible only to its active Firm members or active Project
-- members. Project-only members (for example external clients) retain
-- access solely to the Project they accepted.

CREATE OR REPLACE FUNCTION public.current_person_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.people WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_firm_member(p_firm_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.firm_members
    WHERE firm_id = p_firm_id AND person_id = public.current_person_id() AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects project_row
    WHERE project_row.id = p_project_id
      AND (
        public.is_current_user_firm_member(project_row.firm_id)
        OR EXISTS (
          SELECT 1 FROM public.project_team member_row
          WHERE member_row.project_id = project_row.id
            AND member_row.person_id = public.current_person_id()
            AND member_row.active = TRUE AND member_row.status = 'active'
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_document_access(p_document_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents
    WHERE id = p_document_id AND public.has_project_access(project_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.has_document_storage_access(p_storage_path TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.document_revisions revision
    JOIN public.documents document_row ON document_row.id = revision.document_id
    WHERE revision.storage_path = p_storage_path
      AND public.has_project_access(document_row.project_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_person_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_firm_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_project_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_document_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_document_storage_access(TEXT) TO authenticated;

-- A Firm can be read only by an active member (or by its creator during the
-- creation transaction). Direct membership writes cannot be used to forge
-- access; joining from a public Firm code uses the controlled function below.
DO $$
DECLARE
  target_table TEXT;
  existing_policy RECORD;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['firms', 'firm_members', 'firm_invitations'] LOOP
    FOR existing_policy IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', existing_policy.policyname, target_table);
    END LOOP;
  END LOOP;
END;
$$;

CREATE POLICY "Members can view firms" ON public.firms
FOR SELECT TO authenticated
USING (public.is_current_user_firm_member(id) OR created_by = auth.uid());
CREATE POLICY "Authenticated users can create firms" ON public.firms
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Members can update firms" ON public.firms
FOR UPDATE TO authenticated
USING (public.is_current_user_firm_member(id))
WITH CHECK (public.is_current_user_firm_member(id));
CREATE POLICY "Members can delete firms" ON public.firms
FOR DELETE TO authenticated USING (public.is_current_user_firm_member(id));

CREATE POLICY "Members can view firm memberships" ON public.firm_members
FOR SELECT TO authenticated
USING (person_id = public.current_person_id() OR public.is_current_user_firm_member(firm_id));
CREATE POLICY "Members can add firm memberships" ON public.firm_members
FOR INSERT TO authenticated
WITH CHECK (
  public.is_current_user_firm_member(firm_id)
  OR (
    person_id = public.current_person_id()
    AND EXISTS (SELECT 1 FROM public.firms WHERE id = firm_id AND created_by = auth.uid())
  )
);
CREATE POLICY "Members can update firm memberships" ON public.firm_members
FOR UPDATE TO authenticated
USING (public.is_current_user_firm_member(firm_id))
WITH CHECK (public.is_current_user_firm_member(firm_id));
CREATE POLICY "Members can delete firm memberships" ON public.firm_members
FOR DELETE TO authenticated USING (public.is_current_user_firm_member(firm_id));

CREATE POLICY "Members can access firm invitations" ON public.firm_invitations
FOR ALL TO authenticated
USING (public.is_current_user_firm_member(firm_id))
WITH CHECK (public.is_current_user_firm_member(firm_id));

CREATE OR REPLACE FUNCTION public.join_firm_by_invite_code(p_invite_code TEXT, p_role_id UUID)
RETURNS public.firms
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_person_id UUID;
  v_firm public.firms%ROWTYPE;
BEGIN
  v_person_id := public.current_person_id();
  IF v_person_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to join a Firm.';
  END IF;

  SELECT * INTO v_firm
  FROM public.firms
  WHERE invite_code = upper(trim(p_invite_code));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That invite code was not recognized.';
  END IF;

  INSERT INTO public.firm_members (firm_id, person_id, role_id, status)
  VALUES (v_firm.id, v_person_id, p_role_id, 'active')
  ON CONFLICT (firm_id, person_id)
  DO UPDATE SET role_id = EXCLUDED.role_id, status = 'active';

  RETURN v_firm;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_firm_by_invite_code(TEXT, UUID) TO authenticated;

-- Replace the prior "USING (true)" policies on each project-owned table.
DO $$
DECLARE
  target_table TEXT;
  existing_policy RECORD;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'projects', 'project_team', 'project_invitations', 'documents',
    'document_revisions', 'deliverables', 'project_phase_assignments',
    'project_disciplines', 'project_tags', 'requirements',
    'project_onboarding', 'project_questionnaire_responses',
    'project_setup', 'delegations', 'notifications'
  ] LOOP
    FOR existing_policy IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', existing_policy.policyname, target_table);
    END LOOP;
  END LOOP;
END;
$$;

CREATE POLICY "Members can select projects" ON public.projects
FOR SELECT TO authenticated USING (public.has_project_access(id));
CREATE POLICY "Firm members can create projects" ON public.projects
FOR INSERT TO authenticated WITH CHECK (public.is_current_user_firm_member(firm_id));
CREATE POLICY "Members can update projects" ON public.projects
FOR UPDATE TO authenticated USING (public.has_project_access(id)) WITH CHECK (public.has_project_access(id));
CREATE POLICY "Members can delete projects" ON public.projects
FOR DELETE TO authenticated USING (public.has_project_access(id));

CREATE POLICY "Members can access project team" ON public.project_team
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access project invitations" ON public.project_invitations
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access documents" ON public.documents
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access document revisions" ON public.document_revisions
FOR ALL TO authenticated USING (public.has_document_access(document_id)) WITH CHECK (public.has_document_access(document_id));
CREATE POLICY "Members can access deliverables" ON public.deliverables
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access phase assignments" ON public.project_phase_assignments
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access project disciplines" ON public.project_disciplines
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access project tags" ON public.project_tags
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access requirements" ON public.requirements
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access project onboarding" ON public.project_onboarding
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access questionnaire responses" ON public.project_questionnaire_responses
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access project setup" ON public.project_setup
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));
CREATE POLICY "Members can access delegations" ON public.delegations
FOR ALL TO authenticated USING (public.has_project_access(project_id)) WITH CHECK (public.has_project_access(project_id));

-- Notification writes are server-side. A browser session may only read or
-- acknowledge its own notifications for a Project it can access.
CREATE POLICY "Recipients can view notifications" ON public.notifications
FOR SELECT TO authenticated
USING (recipient_person_id = public.current_person_id() AND public.has_project_access(project_id));
CREATE POLICY "Recipients can update notifications" ON public.notifications
FOR UPDATE TO authenticated
USING (recipient_person_id = public.current_person_id() AND public.has_project_access(project_id))
WITH CHECK (recipient_person_id = public.current_person_id() AND public.has_project_access(project_id));

-- Uploads are deliberately server-side with the service role. Browser users
-- can only retrieve a private object after its metadata proves access.
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Members can read document files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND public.has_document_storage_access(name));

-- This is the only controlled path for a user with no existing project
-- access to become a Project member. The code is validated and consumed in
-- the same transaction; no permissive self-join RLS policy is required.
CREATE OR REPLACE FUNCTION public.accept_project_invitation(p_invite_code TEXT)
RETURNS public.project_invitations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_person_id UUID;
  v_invitation public.project_invitations%ROWTYPE;
  v_consultant_role_id UUID;
BEGIN
  v_person_id := public.current_person_id();
  IF v_person_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to accept a project invitation.';
  END IF;

  SELECT * INTO v_invitation
  FROM public.project_invitations
  WHERE invite_code = upper(trim(p_invite_code)) AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That invitation link was not recognized or is no longer active.';
  END IF;

  INSERT INTO public.project_team (project_id, person_id, role_id, active, status, invited_by)
  VALUES (v_invitation.project_id, v_person_id, v_invitation.role_id, TRUE, 'active', v_invitation.invited_by)
  ON CONFLICT (project_id, person_id, role_id)
  DO UPDATE SET active = TRUE, status = 'active', invited_by = EXCLUDED.invited_by;

  UPDATE public.project_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invitation.id
  RETURNING * INTO v_invitation;

  -- Preserve the existing automatic Firm join for non-client invitees.
  IF NOT v_invitation.is_main_client_invite
     AND NOT EXISTS (SELECT 1 FROM public.firm_members WHERE person_id = v_person_id AND status = 'active')
  THEN
    SELECT id INTO v_consultant_role_id FROM public.roles WHERE name = 'Consultant' LIMIT 1;
    IF v_consultant_role_id IS NOT NULL THEN
      INSERT INTO public.firm_members (firm_id, person_id, role_id, status)
      SELECT firm_id, v_person_id, v_consultant_role_id, 'active'
      FROM public.projects WHERE id = v_invitation.project_id AND firm_id IS NOT NULL
      ON CONFLICT (firm_id, person_id) DO UPDATE SET status = 'active';
    END IF;
  END IF;

  RETURN v_invitation;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_project_invitation(TEXT) TO authenticated;
