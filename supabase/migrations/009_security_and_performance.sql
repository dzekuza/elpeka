-- ============================================================
-- 009: Security hardening + RLS performance + missing indexes
-- ============================================================

-- ── 1. Fix mutable search_path on helper functions ──────────
-- Prevents search_path injection attacks against SECURITY DEFINER functions.
-- Must fully qualify table names when search_path = ''.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.owner_unit_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT unit_id FROM public.unit_owners WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ── 2. Revoke public RPC access on internal helper functions ─
-- These functions are RLS helpers — they should never be callable
-- directly by anon or authenticated users via /rest/v1/rpc/.
-- Revoking EXECUTE does NOT affect their use inside RLS policies.

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.owner_unit_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.owner_unit_id() FROM authenticated;

-- ── 3. Fix RLS initialization plan — wrap auth.uid() in SELECT ──
-- auth.uid() is re-evaluated for every row. Wrapping in (SELECT ...)
-- allows Postgres to evaluate it once and cache the result.

-- unit_owners: owners_read_own_row
DROP POLICY IF EXISTS "owners_read_own_row" ON public.unit_owners;
CREATE POLICY "owners_read_own_row" ON public.unit_owners
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- defects: owners_insert_defects
DROP POLICY IF EXISTS "owners_insert_defects" ON public.defects;
CREATE POLICY "owners_insert_defects" ON public.defects
  FOR INSERT
  WITH CHECK (unit_id = owner_unit_id() AND submitted_by = (SELECT auth.uid()));

-- defect_attachments: owners_insert_defect_attachments
DROP POLICY IF EXISTS "owners_insert_defect_attachments" ON public.defect_attachments;
CREATE POLICY "owners_insert_defect_attachments" ON public.defect_attachments
  FOR INSERT
  WITH CHECK (
    defect_id IN (SELECT id FROM public.defects WHERE unit_id = owner_unit_id())
    AND uploaded_by = (SELECT auth.uid())
  );

-- ── 4. Missing indexes on foreign key columns ─────────────────
-- Supabase advisor flagged 8 unindexed FKs. These are needed for
-- JOIN performance and ON DELETE CASCADE efficiency.

CREATE INDEX IF NOT EXISTS defect_attachments_defect_id_idx
  ON public.defect_attachments(defect_id);

CREATE INDEX IF NOT EXISTS defect_attachments_uploaded_by_idx
  ON public.defect_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS defect_replies_author_id_idx
  ON public.defect_replies(author_id);

CREATE INDEX IF NOT EXISTS defect_reply_attachments_reply_id_idx
  ON public.defect_reply_attachments(reply_id);

CREATE INDEX IF NOT EXISTS defects_submitted_by_idx
  ON public.defects(submitted_by);

CREATE INDEX IF NOT EXISTS documents_uploaded_by_idx
  ON public.documents(uploaded_by);

CREATE INDEX IF NOT EXISTS contact_documents_contact_id_idx
  ON public.contact_documents(contact_id);

-- estate_contacts(contact_id) — estate_id is covered by the existing
-- UNIQUE(estate_id, contact_id) index as the leading column.
CREATE INDEX IF NOT EXISTS estate_contacts_contact_id_idx
  ON public.estate_contacts(contact_id);

-- unit_services(unit_id) — covered by UNIQUE(unit_id, category),
-- but adding explicit index for clarity and non-unique lookups.
CREATE INDEX IF NOT EXISTS unit_services_unit_id_idx
  ON public.unit_services(unit_id);
