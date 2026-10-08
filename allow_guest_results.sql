-- ==========================================
-- السماح للجميع (بما في ذلك الضيوف) بقراءة النتائج التفصيلية
-- Allow everyone (including guests) to read result details
-- ==========================================

-- إضافة سياسة للسماح بقراءة attempts للجميع (anon)
CREATE POLICY "Attempts_Public_Read" 
ON public.attempts 
FOR SELECT 
USING (true);

-- إضافة سياسة للسماح للضيوف بإدراج attempts
-- هذه السياسة موجودة لكن نتأكد منها
CREATE POLICY "Attempts_Guest_Insert" 
ON public.attempts 
FOR INSERT 
WITH CHECK (user_id IS NULL);

COMMENT ON POLICY "Attempts_Public_Read" ON public.attempts IS 
'يسمح لأي شخص (مسجل أو ضيف) بقراءة النتائج التفصيلية';

COMMENT ON POLICY "Attempts_Guest_Insert" ON public.attempts IS 
'يسمح للضيوف بإدراج محاولاتهم في قاعدة البيانات';
