-- Enable Row Level Security on all tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clip_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compilations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compilation_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Drivers: Public read access
CREATE POLICY "drivers_select_all" ON public.drivers
  FOR SELECT USING (true);

-- Races: Public read access
CREATE POLICY "races_select_all" ON public.races
  FOR SELECT USING (true);

-- Categories: Public read access
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

-- Clips: Public can view free clips, authenticated users can view premium
CREATE POLICY "clips_select_free" ON public.clips
  FOR SELECT USING (is_premium = false);

CREATE POLICY "clips_select_premium" ON public.clips
  FOR SELECT USING (
    is_premium = true AND auth.uid() IS NOT NULL
  );

-- Clip tags: Public read access
CREATE POLICY "clip_tags_select_all" ON public.clip_tags
  FOR SELECT USING (true);

-- Compilations: Public read for featured, authenticated for all
CREATE POLICY "compilations_select_featured" ON public.compilations
  FOR SELECT USING (is_featured = true);

CREATE POLICY "compilations_select_authenticated" ON public.compilations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Compilation clips: Public read access
CREATE POLICY "compilation_clips_select_all" ON public.compilation_clips
  FOR SELECT USING (true);

-- Votes: Users can view all votes
CREATE POLICY "votes_select_all" ON public.votes
  FOR SELECT USING (true);

-- Votes: Users can insert their own votes
CREATE POLICY "votes_insert_own" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Votes: Users can update their own votes
CREATE POLICY "votes_update_own" ON public.votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Votes: Users can delete their own votes
CREATE POLICY "votes_delete_own" ON public.votes
  FOR DELETE USING (auth.uid() = user_id);
