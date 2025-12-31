-- 1. CLEAN SLATE: Drop all existing policies on profiles and classes to ensure no conflicts
-- This loop will find and drop every policy on these two tables.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'classes' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.classes';
    END LOOP;
END $$;

-- 2. Profiles Policies (Non-Recursive approach using JWT metadata)
-- We avoid querying "profiles" inside the policy to prevent "infinite recursion".
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read profiles (needed for various lookups in your code)
CREATE POLICY "Public Read Profiles" ON public.profiles FOR
SELECT USING (true);

-- Allow users to edit their own data
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR
UPDATE USING (auth.uid () = id);

-- Admin access using JWT metadata (avoids hitting the table)
CREATE POLICY "Admin Full Access" ON public.profiles FOR ALL USING (
    (
        auth.jwt () -> 'user_metadata' ->> 'role'
    ) = 'admin'
);

-- 3. Classes Table Policies
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read classes (fixes the signup dropdown error)
CREATE POLICY "Public Read Classes" ON public.classes FOR
SELECT USING (true);

-- Admin access for classes
CREATE POLICY "Admin Edit Classes" ON public.classes FOR ALL USING (
    (
        auth.jwt () -> 'user_metadata' ->> 'role'
    ) = 'admin'
);

-- 4. Fix User Creation Trigger
-- This script matches the column names found in your JavaScript files (name, class).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, class, student_number)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'class', new.raw_user_meta_data->>'class_id', ''),
    new.raw_user_meta_data->>'student_number'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    class = EXCLUDED.class,
    student_number = EXCLUDED.student_number;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();