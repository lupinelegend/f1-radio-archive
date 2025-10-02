-- Migration to add OpenF1 API integration fields
-- This adds fields needed to store data from OpenF1 API

-- Add OpenF1 fields to drivers table
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS team_color TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS headshot_url TEXT,
ADD COLUMN IF NOT EXISTS name_acronym TEXT;

-- Add unique constraint on driver number to prevent duplicates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drivers_number_unique'
  ) THEN
    ALTER TABLE public.drivers ADD CONSTRAINT drivers_number_unique UNIQUE (number);
  END IF;
END $$;

-- Add OpenF1 fields to races table
ALTER TABLE public.races
ADD COLUMN IF NOT EXISTS session_key INTEGER,
ADD COLUMN IF NOT EXISTS meeting_key INTEGER;

-- Add unique constraint on session_key to prevent duplicate sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'races_session_key_unique'
  ) THEN
    ALTER TABLE public.races ADD CONSTRAINT races_session_key_unique UNIQUE (session_key);
  END IF;
END $$;

-- Add timestamp field to clips for radio message timestamp
ALTER TABLE public.clips
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ;

-- Add unique constraint on audio_url to prevent duplicate radio messages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clips_audio_url_unique'
  ) THEN
    ALTER TABLE public.clips ADD CONSTRAINT clips_audio_url_unique UNIQUE (audio_url);
  END IF;
END $$;

-- Create indexes for OpenF1 fields
CREATE INDEX IF NOT EXISTS idx_drivers_number ON public.drivers(number);
CREATE INDEX IF NOT EXISTS idx_races_session_key ON public.races(session_key);
CREATE INDEX IF NOT EXISTS idx_races_meeting_key ON public.races(meeting_key);
CREATE INDEX IF NOT EXISTS idx_clips_timestamp ON public.clips(timestamp);

-- Add comment to document the OpenF1 integration
COMMENT ON COLUMN public.drivers.team_color IS 'Team color hex code from OpenF1 API';
COMMENT ON COLUMN public.drivers.country_code IS 'ISO country code from OpenF1 API';
COMMENT ON COLUMN public.drivers.headshot_url IS 'Driver headshot image URL from OpenF1 API';
COMMENT ON COLUMN public.drivers.name_acronym IS 'Three-letter driver acronym from OpenF1 API';
COMMENT ON COLUMN public.races.session_key IS 'Unique session identifier from OpenF1 API';
COMMENT ON COLUMN public.races.meeting_key IS 'Meeting (race weekend) identifier from OpenF1 API';
COMMENT ON COLUMN public.clips.timestamp IS 'Radio message timestamp from OpenF1 API';
