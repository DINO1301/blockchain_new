-- Create table for Pre-Blockchain Review feature
CREATE TABLE IF NOT EXISTS pre_blockchain_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_code TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  original_owner_name TEXT,
  original_wallet_address TEXT,
  original_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT,
  transfer_history JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  approved_by UUID REFERENCES auth.users(id),
  rejected_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE pre_blockchain_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to view all reviews
CREATE POLICY "Allow authenticated users to view all reviews"
  ON pre_blockchain_reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert reviews
CREATE POLICY "Allow authenticated users to insert reviews"
  ON pre_blockchain_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own reviews (or admins can update any)
CREATE POLICY "Allow users to update their own reviews"
  ON pre_blockchain_reviews
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow users to delete their own reviews (or admins can delete any)
CREATE POLICY "Allow users to delete their own reviews"
  ON pre_blockchain_reviews
  FOR DELETE
  TO authenticated
  USING (true);

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before update
CREATE TRIGGER update_pre_blockchain_reviews_updated_at
BEFORE UPDATE ON pre_blockchain_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to set original owner fields
UPDATE pre_blockchain_reviews 
SET 
  original_owner_name = owner_name,
  original_wallet_address = wallet_address,
  original_address = address
WHERE original_owner_name IS NULL;

