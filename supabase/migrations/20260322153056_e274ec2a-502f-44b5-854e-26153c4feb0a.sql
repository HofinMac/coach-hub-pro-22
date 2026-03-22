
-- Create profiles table for coaches
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  training_location TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  years_experience TEXT DEFAULT '',
  certifications TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  session_price INTEGER DEFAULT 0,
  session_length INTEGER DEFAULT 60,
  offer_group BOOLEAN DEFAULT false,
  group_max_size INTEGER DEFAULT 0,
  max_clients INTEGER DEFAULT 0,
  brand_name TEXT DEFAULT '',
  profile_photo_url TEXT DEFAULT '',
  cover_photo_url TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  bg_preset TEXT DEFAULT 'none',
  theme TEXT DEFAULT 'light',
  onboarding_done BOOLEAN DEFAULT false,
  role TEXT NOT NULL DEFAULT 'coach',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for profile assets
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-assets', 'profile-assets', true);

-- Storage policies
CREATE POLICY "Users can upload own assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view profile assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-assets');
