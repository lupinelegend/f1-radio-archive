-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create races table
CREATE TABLE IF NOT EXISTS public.races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  season INTEGER NOT NULL,
  race_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table for clip types
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clips table
CREATE TABLE IF NOT EXISTS public.clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  race_id UUID REFERENCES public.races(id) ON DELETE CASCADE,
  transcript TEXT,
  duration INTEGER, -- in seconds
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clip_tags junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.clip_tags (
  clip_id UUID REFERENCES public.clips(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (clip_id, category_id)
);

-- Create compilations table for curated collections (premium feature)
CREATE TABLE IF NOT EXISTS public.compilations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create compilation_clips junction table
CREATE TABLE IF NOT EXISTS public.compilation_clips (
  compilation_id UUID REFERENCES public.compilations(id) ON DELETE CASCADE,
  clip_id UUID REFERENCES public.clips(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (compilation_id, clip_id)
);

-- Create votes table for community voting
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID REFERENCES public.clips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clip_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clips_driver ON public.clips(driver_id);
CREATE INDEX IF NOT EXISTS idx_clips_race ON public.clips(race_id);
CREATE INDEX IF NOT EXISTS idx_clips_premium ON public.clips(is_premium);
CREATE INDEX IF NOT EXISTS idx_votes_clip ON public.votes(clip_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON public.votes(user_id);
