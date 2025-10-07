-- Create tag suggestions table
CREATE TABLE IF NOT EXISTS tag_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  suggested_category_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  CONSTRAINT check_category_or_name CHECK (
    (category_id IS NOT NULL AND suggested_category_name IS NULL) OR
    (category_id IS NULL AND suggested_category_name IS NOT NULL)
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tag_suggestions_clip_id ON tag_suggestions(clip_id);
CREATE INDEX IF NOT EXISTS idx_tag_suggestions_status ON tag_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_tag_suggestions_user_id ON tag_suggestions(user_id);

-- Enable RLS
ALTER TABLE tag_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create suggestions
CREATE POLICY "Users can create tag suggestions"
  ON tag_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
  ON tag_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anyone can view all suggestions
CREATE POLICY "Anyone can view all tag suggestions"
  ON tag_suggestions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Anyone can update suggestions
CREATE POLICY "Anyone can update tag suggestions"
  ON tag_suggestions
  FOR UPDATE
  TO authenticated
  USING (true);
