-- Create transcript suggestions table
CREATE TABLE IF NOT EXISTS transcript_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_transcript TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_transcript_suggestions_clip_id ON transcript_suggestions(clip_id);
CREATE INDEX IF NOT EXISTS idx_transcript_suggestions_status ON transcript_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_transcript_suggestions_user_id ON transcript_suggestions(user_id);

-- Enable RLS
ALTER TABLE transcript_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create suggestions
CREATE POLICY "Users can create transcript suggestions"
  ON transcript_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
  ON transcript_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all suggestions (you'll need to add admin role logic)
CREATE POLICY "Anyone can view all suggestions"
  ON transcript_suggestions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can update suggestions (you'll need to add admin role logic)
CREATE POLICY "Anyone can update suggestions"
  ON transcript_suggestions
  FOR UPDATE
  TO authenticated
  USING (true);
