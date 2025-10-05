-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, clip_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_clip_id ON favorites(clip_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);
