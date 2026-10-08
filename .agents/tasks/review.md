# تمكين الاختبارات للضيوف: المراجعة الثانية

تمت معالجة 3 من 4 ملاحظات المراجعة الأولى بنجاح. أُضيف تنظيف للإدخال عبر `sanitizeInput()` يزيل HTML tags و JavaScript، استُبدلت نافذة `confirm` برسالة تشجيعية مدمجة في الواجهة مع رابط تسجيل، ونُقلت كل أنماط modal الضيف من inline CSS إلى ملف خارجي مع دعم dark mode. Rate limiting تُرك عمداً للمستقبل كما هو موثق.

**Watch for:** لا توجد مشاكل جوهرية متبقية. التنفيذ الحالي آمن ويعمل بشكل صحيح للضيوف والمستخدمين المسجلين.

**Verdict**: APPROVED

## High-level view

التنظيف الآمن للإدخال أصبح مفعّلاً: `sanitizeInput()` تزيل `<>` و `javascript:` وأي event handlers قبل الحفظ، والطول محدود بـ 100 حرف من HTML وJavaScript. التجربة بعد الاختبار للضيوف تحسّنت: بدلاً من نافذة confirm متطفلة، يظهر info-card مدمج في الصفحة يحتوي النتيجة ورابط "إنشاء حساب مجاناً". الأنماط انتقلت من inline إلى `css/style.css` مع استخدام CSS variables للتوافق مع dark mode. سياسات RLS لم تتغير وتبقى صحيحة. المستخدمون المسجلون يحافظون على نفس التدفق السابق دون تأثر.

<details>
<summary>Issues (0)</summary>

لا توجد مشاكل جوهرية متبقية تمنع الموافقة.

</details>

<details>
<summary>Details</summary>

## معالجة ملاحظة تنظيف الإدخال

أُضيفت دالة `sanitizeInput()` في `exam-view.js`:

```javascript
function sanitizeInput(input) {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .substring(0, 100);
}
```

تُستدعى في `showGuestNameModal()` قبل حفظ الاسم:

```javascript
const rawName = input.value.trim();
const guestName = sanitizeInput(rawName);
```

هذا يمنع حفظ HTML tags أو JavaScript في قاعدة البيانات. الحد الأقصى 100 حرف مطبّق في HTML (`maxlength="100"`) وفي JavaScript (`substring(0, 100)`) لضمان الحماية من الجهتين.

## تحسين تجربة ما بعد الاختبار

استُبدلت نافذة `confirm()` في `submitExam()` برسالة مدمجة:

```javascript
if (user.isGuest) {
  setTimeout(() => {
    const signupPrompt = document.createElement('div');
    signupPrompt.className = 'info-card';
    signupPrompt.style.marginTop = '1rem';
    signupPrompt.innerHTML = `
      💡 <strong>نصيحة:</strong> سجّل حساباً لحفظ نتائجك ومتابعة تقدمك!
      <a href="../auth/register.html" class="btn" style="margin-top: 0.75rem; display: inline-block;">إنشاء حساب مجاناً</a>
    `;
    if (statusEl && statusEl.parentElement) {
      statusEl.parentElement.appendChild(signupPrompt);
    }
  }, 1000);
}
```

الرسالة تظهر بعد ثانية واحدة من إنهاء الاختبار، مدمجة في الصفحة دون إزعاج. تستخدم نفس class `info-card` المستخدم في بقية المشروع للاتساق البصري.

## نقل CSS من inline إلى ملف خارجي

كل أنماط `guest-modal` نُقلت لـ `css/style.css`. القسم يبدأ بـ:

```css
/* Guest Modal Styles */
.guest-modal {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}
```

كل عنصر له class منفصل: `.guest-modal-content`, `.guest-modal-title`, `.guest-modal-text`, `.guest-modal-input`, `.guest-modal-actions`, `.guest-modal-btn`, `.guest-modal-btn-primary`, `.guest-modal-btn-secondary`.

الأنماط تستخدم CSS variables مثل `var(--surface)`, `var(--text)`, `var(--primary)`, `var(--border)` للتوافق التلقائي مع dark mode.

HTML نظيف الآن بدون inline styles، فقط classes:

```html
<div id="guestModal" class="guest-modal">
  <div class="guest-modal-content">
    <h2 class="guest-modal-title">مرحباً بك في الاختبار</h2>
    <p class="guest-modal-text">أدخل اسمك (اختياري) لتظهر في النتائج</p>
    <input id="guestNameInput" type="text" placeholder="اسمك (اختياري)" class="guest-modal-input" maxlength="100" />
    <div class="guest-modal-actions">
      <button id="guestStartBtn" class="guest-modal-btn guest-modal-btn-primary">ابدأ الاختبار</button>
      <a href="../auth/login.html" class="guest-modal-btn guest-modal-btn-secondary">تسجيل الدخول</a>
    </div>
  </div>
</div>
```

## Rate limiting

لم يُعالج rate limiting، كما هو موثق في `implementation-summary.md`:

> **القرار:** ترك الأمر كما هو والاعتماد على مراقبة المعلم  
> **السبب:** Rate limiting بحاجة إلى IP معقد ويحتاج backend إضافي  
> **الهدف الرئيسي هو:** تسهيل الوصول  
> **المعلمون يستطيعون:** رؤية النتائج المشبوهة في لوحة التحكم

هذا قرار معقول للمرحلة الحالية. المشروع تعليمي، ليس منصة عامة عالية المخاطر. المعلمون لديهم سياسة SELECT في RLS تسمح لهم بمراجعة محاولات الضيوف، فيمكنهم رصد النشاط المشبوه يدوياً.

## File map

<details>
<summary>Files changed (3 + 1 new)</summary>

- **js/exam-view.js** — إضافة `sanitizeInput()` واستخدامها في `showGuestNameModal()`، استبدال `confirm()` بـ info-card في `submitExam()`
- **pages/profiles/exam-view.html** — إزالة inline styles واستبدالها بـ CSS classes، إضافة `maxlength="100"` لـ input
- **css/style.css** — إضافة قسم كامل لأنماط guest modal مع دعم dark mode و hover effects
- **guest_exam_rls.sql** — (لم يتغير) سياسات RLS للسماح بإدراج محاولات الضيوف

</details>

</details>
