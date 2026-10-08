-- =====================================================
-- تعديل سياسات RLS لجدول attempts
-- يسمح للمستخدمين غير المسجلين (anon) بإدراج محاولات
-- بشرط أن يكون user_id فارغاً (NULL)
-- =====================================================

-- أولاً: جعل user_id في جدول attempts قابل للـ NULL
-- (قد يكون مضبوطاً بالفعل، لكن نتأكد)
ALTER TABLE public.attempts ALTER COLUMN user_id DROP NOT NULL;

-- ثانياً: إزالة قيد ON DELETE CASCADE الذي قد يمنع NULL
-- (إذا كان العمود يحتوي FOREIGN KEY مع NOT NULL ضمني)
-- لا حاجة لتعديل الـ FK نفسه، فـ NULL مسموح به في FK بشكل افتراضي

-- ثالثاً: إضافة سياسة تسمح للمستخدم المجهول (anon) بالإدراج
-- بشرط أن user_id = NULL (لمنع الانتحال)
DROP POLICY IF EXISTS "Anon Insert Guest Attempts" ON public.attempts;
CREATE POLICY "Anon Insert Guest Attempts" ON public.attempts
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- رابعاً: سياسة للقراءة العامة لمحاولات الضيوف (اختياري - للمراجعة)
DROP POLICY IF EXISTS "Admin Read Guest Attempts" ON public.attempts;
CREATE POLICY "Admin Read Guest Attempts" ON public.attempts
  FOR SELECT
  TO authenticated
  USING (
    user_id IS NULL
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
    )
  );
