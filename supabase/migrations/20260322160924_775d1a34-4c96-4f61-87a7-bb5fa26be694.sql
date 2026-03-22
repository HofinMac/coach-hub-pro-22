
CREATE TABLE public.gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  website text DEFAULT '',
  equipment text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read all gyms
CREATE POLICY "Anyone can read gyms"
  ON public.gyms FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert new gyms
CREATE POLICY "Authenticated users can insert gyms"
  ON public.gyms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);
