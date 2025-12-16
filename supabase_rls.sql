-- تفعيل Row Level Security (RLS) على جدول exams
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- 1) سياسة السماح بإضافة اختبار جديد (INSERT)
-- تسمح لأي شخص (مجهول أو مسجل) بإضافة صفوف جديدة
-- هذا مخصص لمرحلة Prototype كما هو مطلوب
CREATE POLICY "Enable insert for all users"
ON exams
FOR INSERT
TO public
WITH CHECK (true);

-- 2) سياسة السماح بقراءة الاختبارات (SELECT)
-- تسمح بالقراءة فقط إذا كان الحقل visibility يساوي 'public'
-- متاحة لجميع المستخدمين (TO public)
CREATE POLICY "Enable read regarding visibility"
ON exams
FOR SELECT
TO public
USING (visibility = 'public');

-- ملاحظات:
-- لم يتم إنشاء سياسات لـ UPDATE أو DELETE، مما يعني أنها ممنوعة افتراضياً (Deny All)
-- لا يوجد اعتماد على جدول مستخدمين خارجي
