
CREATE TABLE public.challenges (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  topic text NOT NULL,
  difficulty text NOT NULL,
  question_count integer NOT NULL,
  questions jsonb NOT NULL,
  creator_name text NOT NULL,
  creator_score integer NOT NULL,
  creator_time integer NOT NULL,
  challenger_name text,
  challenger_score integer,
  challenger_time integer,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read challenges"
  ON public.challenges FOR SELECT TO anon USING (true);

CREATE POLICY "Anyone can insert challenges"
  ON public.challenges FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anyone can update challenges"
  ON public.challenges FOR UPDATE TO anon USING (true) WITH CHECK (true);
