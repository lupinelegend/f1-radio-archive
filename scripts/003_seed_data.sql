-- Insert sample drivers
INSERT INTO public.drivers (name, team, number) VALUES
  ('Max Verstappen', 'Red Bull Racing', 1),
  ('Lewis Hamilton', 'Mercedes', 44),
  ('Charles Leclerc', 'Ferrari', 16),
  ('Lando Norris', 'McLaren', 4),
  ('Carlos Sainz', 'Ferrari', 55),
  ('George Russell', 'Mercedes', 63),
  ('Sergio Perez', 'Red Bull Racing', 11),
  ('Fernando Alonso', 'Aston Martin', 14)
ON CONFLICT DO NOTHING;

-- Insert sample races
INSERT INTO public.races (name, location, season, race_date) VALUES
  ('Bahrain Grand Prix', 'Sakhir', 2024, '2024-03-02'),
  ('Saudi Arabian Grand Prix', 'Jeddah', 2024, '2024-03-09'),
  ('Australian Grand Prix', 'Melbourne', 2024, '2024-03-24'),
  ('Japanese Grand Prix', 'Suzuka', 2024, '2024-04-07'),
  ('Monaco Grand Prix', 'Monte Carlo', 2024, '2024-05-26'),
  ('British Grand Prix', 'Silverstone', 2024, '2024-07-07'),
  ('Italian Grand Prix', 'Monza', 2024, '2024-09-01'),
  ('Singapore Grand Prix', 'Marina Bay', 2024, '2024-09-22')
ON CONFLICT DO NOTHING;

-- Insert categories
INSERT INTO public.categories (name, description) VALUES
  ('Rage', 'Angry or frustrated team radio moments'),
  ('Strategy', 'Strategic calls and pit stop discussions'),
  ('Funny', 'Humorous and lighthearted moments'),
  ('Victory', 'Celebration and winning moments'),
  ('Controversy', 'Controversial or disputed incidents'),
  ('Technical', 'Technical issues and car problems'),
  ('Overtake', 'Exciting overtaking maneuvers'),
  ('Teamwork', 'Great team coordination moments')
ON CONFLICT (name) DO NOTHING;

-- Insert sample clips (using placeholder audio URLs)
INSERT INTO public.clips (title, audio_url, driver_id, race_id, transcript, duration, is_premium)
SELECT 
  'Max Verstappen - "Simply Lovely"',
  '/audio/verstappen-simply-lovely.mp3',
  d.id,
  r.id,
  'Simply lovely, guys. Simply lovely.',
  8,
  false
FROM public.drivers d, public.races r
WHERE d.name = 'Max Verstappen' AND r.name = 'Monaco Grand Prix'
ON CONFLICT DO NOTHING;

INSERT INTO public.clips (title, audio_url, driver_id, race_id, transcript, duration, is_premium)
SELECT 
  'Lewis Hamilton - Strategy Discussion',
  '/audio/hamilton-strategy.mp3',
  d.id,
  r.id,
  'Box box, box box. Are we sure about this?',
  12,
  false
FROM public.drivers d, public.races r
WHERE d.name = 'Lewis Hamilton' AND r.name = 'British Grand Prix'
ON CONFLICT DO NOTHING;

INSERT INTO public.clips (title, audio_url, driver_id, race_id, transcript, duration, is_premium)
SELECT 
  'Charles Leclerc - "I am stupid"',
  '/audio/leclerc-stupid.mp3',
  d.id,
  r.id,
  'I am stupid, I am stupid!',
  6,
  false
FROM public.drivers d, public.races r
WHERE d.name = 'Charles Leclerc' AND r.name = 'Italian Grand Prix'
ON CONFLICT DO NOTHING;

INSERT INTO public.clips (title, audio_url, driver_id, race_id, transcript, duration, is_premium)
SELECT 
  'Lando Norris - Funny Moment',
  '/audio/norris-funny.mp3',
  d.id,
  r.id,
  'Guys, I think I just saw a bird. That was close!',
  10,
  true
FROM public.drivers d, public.races r
WHERE d.name = 'Lando Norris' AND r.name = 'Singapore Grand Prix'
ON CONFLICT DO NOTHING;

-- Tag the clips with categories
INSERT INTO public.clip_tags (clip_id, category_id)
SELECT c.id, cat.id
FROM public.clips c, public.categories cat
WHERE c.title LIKE '%Simply Lovely%' AND cat.name = 'Victory'
ON CONFLICT DO NOTHING;

INSERT INTO public.clip_tags (clip_id, category_id)
SELECT c.id, cat.id
FROM public.clips c, public.categories cat
WHERE c.title LIKE '%Strategy%' AND cat.name = 'Strategy'
ON CONFLICT DO NOTHING;

INSERT INTO public.clip_tags (clip_id, category_id)
SELECT c.id, cat.id
FROM public.clips c, public.categories cat
WHERE c.title LIKE '%stupid%' AND cat.name IN ('Rage', 'Funny')
ON CONFLICT DO NOTHING;

INSERT INTO public.clip_tags (clip_id, category_id)
SELECT c.id, cat.id
FROM public.clips c, public.categories cat
WHERE c.title LIKE '%Funny Moment%' AND cat.name = 'Funny'
ON CONFLICT DO NOTHING;
