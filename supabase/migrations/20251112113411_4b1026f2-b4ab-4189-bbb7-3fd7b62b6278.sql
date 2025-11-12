-- Create profiles table for user data and streak tracking
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create acts table for daily acts of kindness
CREATE TABLE public.acts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on acts
ALTER TABLE public.acts ENABLE ROW LEVEL SECURITY;

-- Acts policies (everyone can read acts)
CREATE POLICY "Anyone can view acts"
  ON public.acts FOR SELECT
  USING (true);

-- Create completions table to track when users complete acts
CREATE TABLE public.completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  act_id UUID NOT NULL REFERENCES public.acts(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  UNIQUE(user_id, act_id)
);

-- Enable RLS on completions
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

-- Completions policies
CREATE POLICY "Users can view their own completions"
  ON public.completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON public.completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profile timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial acts of kindness
INSERT INTO public.acts (title, description, date) VALUES
  ('Compliment a stranger', 'Give someone a genuine compliment today', CURRENT_DATE),
  ('Hold the door', 'Hold the door open for the person behind you', CURRENT_DATE + INTERVAL '1 day'),
  ('Share a smile', 'Smile at five people you pass today', CURRENT_DATE + INTERVAL '2 days'),
  ('Call a friend', 'Call someone you haven''t talked to in a while', CURRENT_DATE + INTERVAL '3 days'),
  ('Leave a positive review', 'Write a positive review for a local business', CURRENT_DATE + INTERVAL '4 days'),
  ('Pick up litter', 'Pick up 5 pieces of litter in your neighborhood', CURRENT_DATE + INTERVAL '5 days'),
  ('Send a thank you note', 'Write a thank you note to someone who helped you', CURRENT_DATE + INTERVAL '6 days');