-- ==========================================
-- FINAL FIX FOR RLS AND ROLE MANAGEMENT
-- This script replaces fragile JWT-based policies with robust table-based checks.
-- ==========================================

-- 1. CLEAN SLATE: DROP OLD POLICIES
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'classes', 'teacher_classes', 'student_classes', 'exams', 'attempts', 'teacher_students')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public."' || r.tablename || '"';
    END LOOP;
END $$;

-- 2. HELPER FUNCTIONS FOR ROLE CHECKING (SECURITY DEFINER)
-- These functions run with higher privileges to check the profiles table without recursion.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. APPLY POLICIES

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles_Public_Read" ON public.profiles FOR
SELECT USING (true);

CREATE POLICY "Profiles_Self_Manage" ON public.profiles FOR ALL USING (auth.uid () = id);

CREATE POLICY "Profiles_Admin_All" ON public.profiles FOR ALL USING (public.is_admin ());

-- CLASSES
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes_Public_Read" ON public.classes FOR
SELECT USING (true);

CREATE POLICY "Classes_Admin_All" ON public.classes FOR ALL USING (public.is_admin ());

-- TEACHER_CLASSES
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TeacherClasses_Read" ON public.teacher_classes FOR
SELECT USING (true);

CREATE POLICY "TeacherClasses_Teacher_Manage" ON public.teacher_classes FOR ALL USING (auth.uid () = teacher_id);

CREATE POLICY "TeacherClasses_Admin_All" ON public.teacher_classes FOR ALL USING (public.is_admin ());

-- STUDENT_CLASSES
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "StudentClasses_Read" ON public.student_classes FOR
SELECT USING (true);

CREATE POLICY "StudentClasses_Student_Manage" ON public.student_classes FOR ALL USING (auth.uid () = student_id);

CREATE POLICY "StudentClasses_Admin_All" ON public.student_classes FOR ALL USING (public.is_admin ());

-- EXAMS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exams_Public_Read" ON public.exams FOR
SELECT USING (true);

CREATE POLICY "Exams_Author_Manage" ON public.exams FOR ALL USING (auth.uid () = author_id);

CREATE POLICY "Exams_Admin_All" ON public.exams FOR ALL USING (public.is_admin ());

-- ATTEMPTS
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attempts_Owner_Manage" ON public.attempts FOR ALL USING (auth.uid () = user_id);

CREATE POLICY "Attempts_Admin_All" ON public.attempts FOR ALL USING (public.is_admin ());
-- Teachers can read attempts of students in their classes
CREATE POLICY "Attempts_Teacher_Read" ON public.attempts FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.teacher_classes tc
                JOIN public.student_classes sc ON tc.class_id = sc.class_id
            WHERE
                tc.teacher_id = auth.uid ()
                AND sc.student_id = public.attempts.user_id
        )
    );

-- TEACHER_STUDENTS (Legacy support)
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TeacherStudents_Teacher_Manage" ON public.teacher_students FOR ALL USING (teacher_id = auth.uid ());

CREATE POLICY "TeacherStudents_Admin_All" ON public.teacher_students FOR ALL USING (public.is_admin ());

-- 4. FIX HANDLE_NEW_USER TRIGGER (Ensure it updates existing profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, name, class, student_number)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'class', ''),
    new.raw_user_meta_data->>'student_number'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    name = EXCLUDED.name,
    class = EXCLUDED.class,
    student_number = EXCLUDED.student_number;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;