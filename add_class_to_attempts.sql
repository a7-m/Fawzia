-- =====================================================
-- إضافة حقل class إلى جدول attempts
-- لتخزين الصف الخاص بالطالب (سواء مسجل أو ضيف)
-- =====================================================

-- إضافة عمود class
ALTER TABLE public.attempts 
ADD COLUMN IF NOT EXISTS class TEXT;

-- إضافة تعليق توضيحي
COMMENT ON COLUMN public.attempts.class IS 'الصف الدراسي للطالب (مسجل أو ضيف)';
