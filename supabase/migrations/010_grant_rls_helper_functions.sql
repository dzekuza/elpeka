-- Migration 009 revoked PUBLIC execute on helper functions for security.
-- Re-grant to authenticated so RLS policies can call them.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owner_unit_id() TO authenticated;
