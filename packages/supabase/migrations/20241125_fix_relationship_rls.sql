-- Migration: Fix RLS for Client Professional Relationships
-- Description: Relaxes the INSERT policy to allow professionals to create relationships even if they haven't fully configured their services table yet.
-- Date: 2024-11-25

-- Drop the existing strict policy
DROP POLICY IF EXISTS "professionals_invite_clients" ON client_professional_relationships;

-- Create a more permissive policy
CREATE POLICY "professionals_invite_clients" ON client_professional_relationships
FOR INSERT
WITH CHECK (
  professional_id = auth.uid() AND
  invited_by = auth.uid()
  -- We removed the strict check for professional_services existence to allow easier onboarding/testing.
  -- The UI should handle the service selection logic.
);

-- Ensure we have policies for the new pending_client_id column if needed
-- (The existing policies cover row-level access, so as long as the row is inserted, we are good.
-- But we need to ensure professionals can VIEW the rows they inserted with pending_client_id)

-- Drop existing view policy
DROP POLICY IF EXISTS "professionals_view_their_relationships" ON client_professional_relationships;

-- Recreate view policy to explicitly include pending relationships if needed (though professional_id check should cover it)
CREATE POLICY "professionals_view_their_relationships" ON client_professional_relationships
FOR SELECT
USING (professional_id = auth.uid());

-- Also ensure we can DELETE pending relationships we created
DROP POLICY IF EXISTS "creator_delete_pending_relationship" ON client_professional_relationships;

CREATE POLICY "creator_delete_pending_relationship" ON client_professional_relationships
FOR DELETE
USING (
  invited_by = auth.uid() AND
  relationship_status = 'pending'
);
