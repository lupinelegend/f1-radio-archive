-- Insert sample compilations
INSERT INTO public.compilations (title, description, is_featured)
VALUES
  (
    'Best Rage Moments 2024',
    'The most explosive and heated team radio exchanges from the 2024 season',
    true
  ),
  (
    'Victory Celebrations',
    'Emotional winning moments and championship celebrations',
    true
  ),
  (
    'Funny Radio Fails',
    'Hilarious miscommunications and unexpected moments',
    false
  )
ON CONFLICT DO NOTHING;

-- Link clips to compilations
INSERT INTO public.compilation_clips (compilation_id, clip_id, position)
SELECT c.id, cl.id, 1
FROM public.compilations c, public.clips cl
WHERE c.title = 'Best Rage Moments 2024' AND cl.title LIKE '%stupid%'
ON CONFLICT DO NOTHING;

INSERT INTO public.compilation_clips (compilation_id, clip_id, position)
SELECT c.id, cl.id, 1
FROM public.compilations c, public.clips cl
WHERE c.title = 'Victory Celebrations' AND cl.title LIKE '%Simply Lovely%'
ON CONFLICT DO NOTHING;

INSERT INTO public.compilation_clips (compilation_id, clip_id, position)
SELECT c.id, cl.id, 1
FROM public.compilations c, public.clips cl
WHERE c.title = 'Funny Radio Fails' AND cl.title LIKE '%Funny Moment%'
ON CONFLICT DO NOTHING;
