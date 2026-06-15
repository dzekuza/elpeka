-- ============================================================
-- 018: Tighten unit-files storage RLS for owners
-- ============================================================
-- The previous owners_unit_files_select policy (015) only checked
-- role = 'owner', meaning any authenticated owner could read any
-- file in the bucket via the Supabase Storage API directly.
-- This migration scopes it to the owner's own units.
-- ── Structure reminder ─────────────────────────────────────
-- photos/{unitId}/...
-- documents/{unitId}/...
-- defects/{defectId}/...   ← defectId ≠ unitId; app-layer signed URL is the gate
-- estates/{estateId}/...   ← admin-only (covered by admins_unit_files_all)
-- contacts/{contactId}/... ← admin-only

DROP POLICY IF EXISTS "owners_unit_files_select" ON storage.objects;

CREATE POLICY "owners_unit_files_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'unit-files'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
    AND (
      -- photos/{unitId}/... and documents/{unitId}/... — segment 2 is the unitId
      (
        split_part(name, '/', 1) IN ('photos', 'documents')
        AND split_part(name, '/', 2)::uuid = ANY(public.owner_unit_ids())
      )
      OR
      -- defects/{defectId}/... — ownership enforced at app layer via signed URL;
      -- allow the folder so the redirect from /api/storage/preview can resolve,
      -- but the route itself already verified unit ownership before calling createSignedUrl.
      split_part(name, '/', 1) = 'defects'
    )
  );
