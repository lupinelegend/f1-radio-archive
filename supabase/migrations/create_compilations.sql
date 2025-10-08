-- Create compilations table
CREATE TABLE IF NOT EXISTS compilations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create compilation_clips junction table
CREATE TABLE IF NOT EXISTS compilation_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compilation_id UUID NOT NULL REFERENCES compilations(id) ON DELETE CASCADE,
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(compilation_id, clip_id),
  UNIQUE(compilation_id, position)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_compilations_user_id ON compilations(user_id);
CREATE INDEX IF NOT EXISTS idx_compilation_clips_compilation_id ON compilation_clips(compilation_id);
CREATE INDEX IF NOT EXISTS idx_compilation_clips_clip_id ON compilation_clips(clip_id);

-- Enable RLS
ALTER TABLE compilations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compilation_clips ENABLE ROW LEVEL SECURITY;

-- Compilations policies
CREATE POLICY "Users can view their own compilations"
  ON compilations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public compilations"
  ON compilations
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create compilations"
  ON compilations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compilations"
  ON compilations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compilations"
  ON compilations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Compilation clips policies
CREATE POLICY "Users can view clips in their compilations"
  ON compilation_clips
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM compilations
      WHERE compilations.id = compilation_clips.compilation_id
      AND (compilations.user_id = auth.uid() OR compilations.is_public = true)
    )
  );

CREATE POLICY "Users can add clips to their compilations"
  ON compilation_clips
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM compilations
      WHERE compilations.id = compilation_clips.compilation_id
      AND compilations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove clips from their compilations"
  ON compilation_clips
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM compilations
      WHERE compilations.id = compilation_clips.compilation_id
      AND compilations.user_id = auth.uid()
    )
  );
