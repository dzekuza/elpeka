-- ============================================================
-- 015: Fix multi-owner RLS + unit-files storage policies
-- ============================================================

-- ── 1. Add owner_unit_ids() — set-returning replacement for owner_unit_id() ──
-- owner_unit_id() uses LIMIT 1 with no ORDER BY — non-deterministic when a
-- user owns more than one unit. Replace with a function returning uuid[].
-- All policies below are dropped and recreated to use = ANY(owner_unit_ids()).

CREATE OR REPLACE FUNCTION public.owner_unit_ids()
RETURNS uuid[] LANGUAGE sql SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ARRAY(
    SELECT unit_id FROM public.unit_owners
    WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL
  );
$$;

REVOKE EXECUTE ON FUNCTION public.owner_unit_ids() FROM anon;
REVOKE EXECUTE ON FUNCTION public.owner_unit_ids() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.owner_unit_ids() TO authenticated;

-- ── 2. Recreate all policies that referenced owner_unit_id() ─────────────────

-- ESTATES
DROP POLICY IF EXISTS "owners_read_estate" ON public.estates;
CREATE POLICY "owners_read_estate" ON public.estates
  FOR SELECT
  USING (id IN (
    SELECT estate_id FROM public.units WHERE id = ANY(owner_unit_ids())
  ));

-- UNITS
DROP POLICY IF EXISTS "owners_read_own_unit" ON public.units;
CREATE POLICY "owners_read_own_unit" ON public.units
  FOR SELECT
  USING (id = ANY(owner_unit_ids()));

-- DEFECTS
DROP POLICY IF EXISTS "owners_read_own_defects" ON public.defects;
CREATE POLICY "owners_read_own_defects" ON public.defects
  FOR SELECT
  USING (unit_id = ANY(owner_unit_ids()));

DROP POLICY IF EXISTS "owners_insert_defects" ON public.defects;
CREATE POLICY "owners_insert_defects" ON public.defects
  FOR INSERT
  WITH CHECK (unit_id = ANY(owner_unit_ids()) AND submitted_by = (SELECT auth.uid()));

-- DEFECT_ATTACHMENTS
DROP POLICY IF EXISTS "owners_read_own_defect_attachments" ON public.defect_attachments;
CREATE POLICY "owners_read_own_defect_attachments" ON public.defect_attachments
  FOR SELECT
  USING (defect_id IN (
    SELECT id FROM public.defects WHERE unit_id = ANY(owner_unit_ids())
  ));

DROP POLICY IF EXISTS "owners_insert_defect_attachments" ON public.defect_attachments;
CREATE POLICY "owners_insert_defect_attachments" ON public.defect_attachments
  FOR INSERT
  WITH CHECK (
    defect_id IN (SELECT id FROM public.defects WHERE unit_id = ANY(owner_unit_ids()))
    AND uploaded_by = (SELECT auth.uid())
  );

-- DEFECT_REPLIES
DROP POLICY IF EXISTS "owners_read_own_defect_replies" ON public.defect_replies;
CREATE POLICY "owners_read_own_defect_replies" ON public.defect_replies
  FOR SELECT
  USING (defect_id IN (
    SELECT id FROM public.defects WHERE unit_id = ANY(owner_unit_ids())
  ));

-- DEFECT_REPLY_ATTACHMENTS
DROP POLICY IF EXISTS "owners_read_own_reply_attachments" ON public.defect_reply_attachments;
CREATE POLICY "owners_read_own_reply_attachments" ON public.defect_reply_attachments
  FOR SELECT
  USING (
    reply_id IN (
      SELECT dr.id FROM public.defect_replies dr
      JOIN public.defects d ON d.id = dr.defect_id
      WHERE d.unit_id = ANY(owner_unit_ids())
    )
  );

-- DOCUMENTS
DROP POLICY IF EXISTS "owners_read_own_documents" ON public.documents;
CREATE POLICY "owners_read_own_documents" ON public.documents
  FOR SELECT
  USING (unit_id = ANY(owner_unit_ids()));

-- Owners may delete only their own documents (was missing — caused silent no-op
-- in deleteOwnerDocument which then passed caller-supplied storagePath to adminClient)
CREATE POLICY "owners_delete_own_documents" ON public.documents
  FOR DELETE
  USING (unit_id = ANY(owner_unit_ids()));

-- UNIT_SERVICES (from 007)
DROP POLICY IF EXISTS "owner_select_unit_services" ON public.unit_services;
CREATE POLICY "owner_select_unit_services" ON public.unit_services
  FOR SELECT TO authenticated
  USING (unit_id = ANY(owner_unit_ids()));

DROP POLICY IF EXISTS "owner_complete_unit_services" ON public.unit_services;
CREATE POLICY "owner_complete_unit_services" ON public.unit_services
  FOR UPDATE TO authenticated
  USING (unit_id = ANY(owner_unit_ids()))
  WITH CHECK (unit_id = ANY(owner_unit_ids()));

-- CONTACTS (from 005)
DROP POLICY IF EXISTS "owners_read_assigned_contacts" ON public.contacts;
CREATE POLICY "owners_read_assigned_contacts" ON public.contacts
  FOR SELECT
  USING (
    id IN (
      SELECT contact_id FROM public.estate_contacts
      WHERE estate_id IN (
        SELECT estate_id FROM public.units WHERE id = ANY(owner_unit_ids())
      )
    )
  );

DROP POLICY IF EXISTS "owners_read_assigned_contact_docs" ON public.contact_documents;
CREATE POLICY "owners_read_assigned_contact_docs" ON public.contact_documents
  FOR SELECT
  USING (
    contact_id IN (
      SELECT contact_id FROM public.estate_contacts
      WHERE estate_id IN (
        SELECT estate_id FROM public.units WHERE id = ANY(owner_unit_ids())
      )
    )
  );

DROP POLICY IF EXISTS "owners_read_own_estate_contacts" ON public.estate_contacts;
CREATE POLICY "owners_read_own_estate_contacts" ON public.estate_contacts
  FOR SELECT
  USING (
    estate_id IN (
      SELECT estate_id FROM public.units WHERE id = ANY(owner_unit_ids())
    )
  );

-- ── 3. unit-files storage bucket + policies ───────────────────────────────────
-- The bucket exists in production (created manually) but has no version-controlled
-- policies. Adding them here ensures a schema reset restores the correct access rules.

INSERT INTO storage.buckets (id, name, public)
VALUES ('unit-files', 'unit-files', false)
ON CONFLICT (id) DO NOTHING;

-- Admins have full access
CREATE POLICY "admins_unit_files_all" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'unit-files'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'unit-files'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Owners may read files in their bucket (app-layer preview route enforces per-unit
-- ownership via signed URLs; this prevents direct Supabase API bypass)
CREATE POLICY "owners_unit_files_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'unit-files'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );
