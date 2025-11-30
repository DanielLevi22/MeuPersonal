-- Migration: Create Relationship Transfers Table
-- Description: Creates a table to manage student transfer requests between professionals.
-- Date: 2024-11-25

DO $$ BEGIN
    CREATE TYPE transfer_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS relationship_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_category service_category NOT NULL,
  status transfer_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one pending request per student/service/to_professional
  UNIQUE(student_id, service_category, to_professional_id, status)
);

-- Ensure columns exist for ending relationships
ALTER TABLE client_professional_relationships 
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_reason TEXT;

-- Enable RLS
ALTER TABLE relationship_transfers ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. New Professional (Requester) can INSERT requests
DROP POLICY IF EXISTS "new_pro_create_transfer" ON relationship_transfers;
CREATE POLICY "new_pro_create_transfer" ON relationship_transfers
FOR INSERT
WITH CHECK (
  to_professional_id = auth.uid()
);

-- 2. New Professional can VIEW their own requests
DROP POLICY IF EXISTS "new_pro_view_own_requests" ON relationship_transfers;
CREATE POLICY "new_pro_view_own_requests" ON relationship_transfers
FOR SELECT
USING (
  to_professional_id = auth.uid()
);

-- 3. Current Professional (Approver) can VIEW requests targeting them (from_professional_id)
DROP POLICY IF EXISTS "current_pro_view_incoming_requests" ON relationship_transfers;
CREATE POLICY "current_pro_view_incoming_requests" ON relationship_transfers
FOR SELECT
USING (
  from_professional_id = auth.uid()
);

-- 4. Current Professional can UPDATE status of requests targeting them
DROP POLICY IF EXISTS "current_pro_update_incoming_requests" ON relationship_transfers;
CREATE POLICY "current_pro_update_incoming_requests" ON relationship_transfers
FOR UPDATE
USING (
  from_professional_id = auth.uid()
);

-- 5. New Professional can CANCEL (Update status to cancelled) their own pending requests
DROP POLICY IF EXISTS "new_pro_cancel_own_requests" ON relationship_transfers;
CREATE POLICY "new_pro_cancel_own_requests" ON relationship_transfers
FOR UPDATE
USING (
  to_professional_id = auth.uid()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transfers_from_pro ON relationship_transfers(from_professional_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_pro ON relationship_transfers(to_professional_id);
CREATE INDEX IF NOT EXISTS idx_transfers_student ON relationship_transfers(student_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON relationship_transfers(status);

-- Function to handle transfer approval
CREATE OR REPLACE FUNCTION approve_transfer_request(p_transfer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_transfer RECORD;
BEGIN
  -- Get transfer record
  SELECT * INTO v_transfer
  FROM relationship_transfers
  WHERE id = p_transfer_id
  FOR UPDATE;
  
  IF v_transfer IS NULL OR v_transfer.status != 'pending' THEN
    RETURN FALSE;
  END IF;
  
  -- Verify auth (must be the from_professional or admin)
  -- (RLS handles this for direct updates, but this is a function)
  IF v_transfer.from_professional_id != auth.uid() AND 
     NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'admin') THEN
     RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. End old relationship
  UPDATE client_professional_relationships
  SET 
    relationship_status = 'ended',
    ended_at = NOW(),
    ended_reason = 'transferred'
  WHERE 
    client_id = v_transfer.student_id AND
    professional_id = v_transfer.from_professional_id AND
    service_category = v_transfer.service_category AND
    relationship_status = 'active';
    
  -- 2. Create new relationship
  INSERT INTO client_professional_relationships (
    client_id,
    professional_id,
    service_category,
    relationship_status,
    invited_by,
    started_at
  ) VALUES (
    v_transfer.student_id,
    v_transfer.to_professional_id,
    v_transfer.service_category,
    'active',
    v_transfer.to_professional_id, -- The new pro "invited" via transfer
    NOW()
  );
  
  -- 3. Update transfer status
  UPDATE relationship_transfers
  SET status = 'approved', updated_at = NOW()
  WHERE id = p_transfer_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
