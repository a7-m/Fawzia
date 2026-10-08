// reports.js — شاشة تقارير الأداء الشاملة للمشرف
import { checkAuth, signOut, supabase } from "./auth/auth.js";
import { setStatus, hideStatus } from "./shared/helpers.js";

const statusEl = document.getElementById("statusMessage");
let charts = {}; // تخزين مرجعي للرسوم البيانية لإتاحة إعادة رسمها

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  const user = await checkAuth({ protected: true, adminOnly: true });
  if (!user) return;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => signOut());

  // إنشاء التقرير تلقائياً عند فتح الصفحة (آخر 30 يوم)
  await generateReport(30);

  // زر التحديث
  document.getElementById("generateReportBtn")?.addEventListener("click", async () => {
    const days = parseInt(document.getElementById("periodSelect")?.value || "30");
    await generateReport(days);
  });

  // عند تغيير الفترة الزمنية
  document.getElementById("periodSelect")?.addEventListener("change", async (e) => {
    await generateReport(parseInt(e.target.value));
  });

  // زر الطباعة
  document.getElementById("printBtn")?.addEventListener("click", () => window.print());

  // زر التصدير PDF
  document.getElementById("exportPdfBtn")?.addEventListener("click", exportToPdf);

  // حقل البحث في جدول الطلاب
  document.getElementById("studentSearch")?.addEventListener("input", (e) => {
    filterStudentsTable(e.target.value.trim());
  });
});

// ============================================================
// GENERATE REPORT
// ============================================================
async function generateReport(days = 30) {
  showLoading(true);
  hideStatus(statusEl);

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // تحديث التسمية
    updatePeriodLabel(days);

    // جلب البيانات بالتوازي
    const [attemptsResult, profilesResult] = await Promise.all([
      supabase
        .from("attempts")
        .select("id, user_id, subject, level, score_percentage, created_at, student_name, class")
        .gte("created_at", sinceISO)
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, full_name, class_id, role, classes:class_id(id, name, grade)")
        .eq("role", "student"),
    ]);

    if (attemptsResult.error) throw attemptsResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const attempts = attemptsResult.data || [];
    const profiles = profilesResult.data || [];

    // بناء خريطة الطلاب
    const studentMap = new Map();
    profiles.forEach((p) => studentMap.set(p.id, p));

    // حساب الإحصائيات
    const stats = computeStats(attempts);
    renderStats(stats);

    // الرسوم البيانية
    renderDailyAttemptsChart(attempts, days);
    renderScoreDistChart(attempts);
    renderSubjectChart(attempts);
    renderClassChart(attempts, studentMap);

    // جداول الطلاب
    const studentStats = computeStudentStats(attempts, studentMap);
    renderTopStudents(studentStats);
    renderStrugglingStudents(studentStats);
    renderAllStudents(studentStats);

    // تاريخ الإنشاء
    document.getElementById("reportGeneratedAt").textContent =
      `تاريخ الإنشاء: ${new Date().toLocaleString("ar-EG")}`;

    showLoading(false);
  } catch (err) {
    console.error("Report error:", err);
    showLoading(false);
    setStatus(statusEl, "تعذر تحميل بيانات التقرير. حاول مرة أخرى.", "error");
  }
}

// ============================================================
// HELPERS — STATISTICS
// ============================================================
function computeStats(attempts) {
  const total = attempts.length;
  
  // حساب الطلاب الفريدين: المسجلين + الضيوف
  const registeredStudents = new Set(
    attempts.filter(a => a.user_id).map(a => a.user_id)
  ).size;
  
  const guestNames = new Set(
    attempts.filter(a => !a.user_id && a.student_name).map(a => a.student_name)
  ).size;
  
  const uniqueStudents = registeredStudents + guestNames;
  
  const scores = attempts
    .map((a) => a.score_percentage)
    .filter((s) => typeof s === "number");
  const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : 0;
  const passCount = scores.filter((s) => s >= 50).length;
  const passRate = scores.length ? (passCount / scores.length) * 100 : 0;

  return { total, uniqueStudents, avg, passRate };
}

function renderStats({ total, uniqueStudents, avg, passRate }) {
  document.getElementById("statTotalAttempts").textContent = total;
  document.getElementById("statActiveStudents").textContent = uniqueStudents;
  document.getElementById("statAvgScore").textContent = avg.toFixed(1) + "%";
  document.getElementById("statPassRate").textContent = passRate.toFixed(1) + "%";
}

function computeStudentStats(attempts, studentMap) {
  const map = new Map();

  attempts.forEach((a) => {
    // تحديد معرّف فريد: إذا كان guest استخدم الاسم، وإلا استخدم user_id
    const isGuest = !a.user_id;
    const identifier = isGuest ? `guest_${a.student_name || 'غير معروف'}` : a.user_id;
    
    const score = typeof a.score_percentage === "number" ? a.score_percentage : null;
    
    if (!map.has(identifier)) {
      let name, className;
      if (isGuest) {
        name = a.student_name || "ضيف";
        className = a.class || "—";
      } else {
        const profile = studentMap.get(a.user_id);
        name = profile?.full_name || "—";
        className = profile?.classes
          ? `${profile.classes.name}${profile.classes.grade ? ` (${profile.classes.grade})` : ""}`
          : "—";
      }
      
      map.set(identifier, {
        id: identifier,
        name: isGuest ? `👤 ${name}` : name,
        className,
        scores: [],
        attempts: 0,
        isGuest,
      });
    }
    const s = map.get(identifier);
    s.attempts++;
    if (score !== null) s.scores.push(score);
  });

  return Array.from(map.values()).map((s) => {
    const avg = s.scores.length
      ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length
      : null;
    const max = s.scores.length ? Math.max(...s.scores) : null;
    const min = s.scores.length ? Math.min(...s.scores) : null;
    return { ...s, avg, max, min };
  });
}

// ============================================================
// CHARTS
// ============================================================
function destroyChart(key) {
  if (charts[key]) {
    charts[key].destroy();
    delete charts[key];
  }
}

function getChartColors(n) {
  const palette = [
    "#0f766e", "#3b82f6", "#f59e0b", "#10b981",
    "#8b5cf6", "#ef4444", "#06b6d4", "#f97316",
    "#84cc16", "#ec4899",
  ];
  return Array.from({ length: n }, (_, i) => palette[i % palette.length]);
}

/** 1. المحاولات اليومية */
function renderDailyAttemptsChart(attempts, days) {
  destroyChart("daily");
  const ctx = document.getElementById("dailyAttemptsChart");
  if (!ctx) return;

  // بناء سلسلة أيام
  const labels = [];
  const dataMap = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    labels.push(formatDateAr(d));
    dataMap[key] = 0;
  }
  attempts.forEach((a) => {
    const key = a.created_at?.slice(0, 10);
    if (key && key in dataMap) dataMap[key]++;
  });

  charts.daily = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "عدد المحاولات",
          data: Object.values(dataMap),
          borderColor: "#0f766e",
          backgroundColor: "rgba(15,118,110,.12)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: days <= 30 ? 4 : 2,
        },
      ],
    },
    options: chartOptions("عدد المحاولات"),
  });
}

/** 2. توزيع الدرجات */
function renderScoreDistChart(attempts) {
  destroyChart("scoreDist");
  const ctx = document.getElementById("scoreDistChart");
  if (!ctx) return;

  const bands = ["0-20", "21-40", "41-60", "61-80", "81-100"];
  const counts = [0, 0, 0, 0, 0];
  attempts.forEach((a) => {
    const s = a.score_percentage;
    if (typeof s !== "number") return;
    if (s <= 20) counts[0]++;
    else if (s <= 40) counts[1]++;
    else if (s <= 60) counts[2]++;
    else if (s <= 80) counts[3]++;
    else counts[4]++;
  });

  charts.scoreDist = new Chart(ctx, {
    type: "bar",
    data: {
      labels: bands,
      datasets: [
        {
          label: "عدد الطلاب",
          data: counts,
          backgroundColor: ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981"],
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...chartOptions("عدد الطلاب"),
      plugins: {
        ...chartOptions().plugins,
        legend: { display: false },
      },
    },
  });
}

/** 3. متوسط الدرجات حسب المادة */
function renderSubjectChart(attempts) {
  destroyChart("subject");
  const ctx = document.getElementById("subjectChart");
  if (!ctx) return;

  const subjectMap = {};
  attempts.forEach((a) => {
    const subj = a.subject || "غير محدد";
    if (typeof a.score_percentage !== "number") return;
    if (!subjectMap[subj]) subjectMap[subj] = [];
    subjectMap[subj].push(a.score_percentage);
  });

  const labels = Object.keys(subjectMap);
  const data = labels.map((l) => {
    const arr = subjectMap[l];
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  });
  const colors = getChartColors(labels.length);

  charts.subject = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "متوسط الدرجة %",
          data: data.map((v) => parseFloat(v.toFixed(1))),
          backgroundColor: colors,
          borderRadius: 6,
        },
      ],
    },
    options: {
      ...chartOptions("متوسط الدرجة %"),
      indexAxis: "y",
      plugins: {
        ...chartOptions().plugins,
        legend: { display: false },
      },
    },
  });
}

/** 4. متوسط الدرجات حسب الصف */
function renderClassChart(attempts, studentMap) {
  destroyChart("class");
  const ctx = document.getElementById("classChart");
  if (!ctx) return;

  const classMap = {};
  attempts.forEach((a) => {
    let cls;
    if (!a.user_id) {
      // ضيف
      cls = a.class || "غير محدد";
    } else {
      // مسجل
      const profile = studentMap.get(a.user_id);
      cls = profile?.classes ? profile.classes.name : "غير محدد";
    }
    
    if (typeof a.score_percentage !== "number") return;
    if (!classMap[cls]) classMap[cls] = [];
    classMap[cls].push(a.score_percentage);
  });

  const labels = Object.keys(classMap);
  const data = labels.map((l) => {
    const arr = classMap[l];
    return parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1));
  });
  const colors = getChartColors(labels.length);

  charts.class = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { family: "Cairo", size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
    },
  });
}

function chartOptions(yLabel = "") {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: { font: { family: "Cairo", size: 12 } },
      },
      tooltip: {
        rtl: true,
        titleFont: { family: "Cairo" },
        bodyFont: { family: "Cairo" },
      },
    },
    scales: {
      x: { ticks: { font: { family: "Cairo", size: 10 } } },
      y: {
        ticks: { font: { family: "Cairo", size: 10 } },
        title: { display: !!yLabel, text: yLabel, font: { family: "Cairo" } },
      },
    },
  };
}

// ============================================================
// TABLES
// ============================================================
function scoreBar(score) {
  if (score === null) return "—";
  const color =
    score >= 80 ? "bg-emerald-500"
    : score >= 60 ? "bg-blue-500"
    : score >= 40 ? "bg-amber-500"
    : "bg-red-500";
  return `
    <div class="flex items-center gap-2">
      <div class="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
        <div class="${color} h-2 rounded-full" style="width:${Math.min(score, 100)}%"></div>
      </div>
      <span class="text-xs font-semibold">${score.toFixed(1)}%</span>
    </div>`;
}

function statusBadge(avg) {
  if (avg === null) return `<span class="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">لا بيانات</span>`;
  if (avg >= 80) return `<span class="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">ممتاز</span>`;
  if (avg >= 60) return `<span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">جيد</span>`;
  if (avg >= 50) return `<span class="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">مقبول</span>`;
  return `<span class="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">يحتاج متابعة</span>`;
}

function renderTopStudents(studentStats) {
  const tbody = document.getElementById("topStudentsTbody");
  const empty = document.getElementById("topStudentsEmpty");
  if (!tbody) return;
  tbody.innerHTML = "";

  const top = [...studentStats]
    .filter((s) => s.avg !== null)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  if (!top.length) { empty?.classList.remove("hidden"); return; }
  empty?.classList.add("hidden");

  top.forEach((s, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="px-3 py-2 text-center font-bold">${medal}</td>
      <td class="px-3 py-2 font-medium">${s.name}</td>
      <td class="px-3 py-2 text-slate-600">${s.className}</td>
      <td class="px-3 py-2 text-center">${s.attempts}</td>
      <td class="px-3 py-2">${scoreBar(s.avg)}</td>
      <td class="px-3 py-2 text-center text-emerald-600 font-semibold">${s.max !== null ? s.max.toFixed(1) + "%" : "—"}</td>
      <td class="px-3 py-2">${statusBadge(s.avg)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStrugglingStudents(studentStats) {
  const tbody = document.getElementById("strugglingTbody");
  const empty = document.getElementById("strugglingEmpty");
  if (!tbody) return;
  tbody.innerHTML = "";

  const struggling = studentStats
    .filter((s) => s.avg !== null && s.avg < 50)
    .sort((a, b) => a.avg - b.avg);

  if (!struggling.length) { empty?.classList.remove("hidden"); return; }
  empty?.classList.add("hidden");

  struggling.forEach((s) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100 hover:bg-red-50 transition";
    tr.innerHTML = `
      <td class="px-3 py-2 font-medium">${s.name}</td>
      <td class="px-3 py-2 text-slate-600">${s.className}</td>
      <td class="px-3 py-2 text-center">${s.attempts}</td>
      <td class="px-3 py-2">${scoreBar(s.avg)}</td>
      <td class="px-3 py-2">${statusBadge(s.avg)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// حفظ البيانات لعملية الفلترة
let _allStudentsData = [];

function renderAllStudents(studentStats, filter = "") {
  const tbody = document.getElementById("allStudentsTbody");
  const empty = document.getElementById("allStudentsEmpty");
  if (!tbody) return;
  tbody.innerHTML = "";

  _allStudentsData = [...studentStats].sort((a, b) => {
    if (a.avg === null && b.avg === null) return 0;
    if (a.avg === null) return 1;
    if (b.avg === null) return -1;
    return b.avg - a.avg;
  });

  const filtered = filter
    ? _allStudentsData.filter((s) =>
        s.name.toLowerCase().includes(filter.toLowerCase())
      )
    : _allStudentsData;

  if (!filtered.length) { empty?.classList.remove("hidden"); return; }
  empty?.classList.add("hidden");

  filtered.forEach((s) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100 hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="px-3 py-2 font-medium">${s.name}</td>
      <td class="px-3 py-2 text-slate-600">${s.className}</td>
      <td class="px-3 py-2 text-center">${s.attempts}</td>
      <td class="px-3 py-2">${s.avg !== null ? scoreBar(s.avg) : "—"}</td>
      <td class="px-3 py-2 text-center">${s.max !== null ? s.max.toFixed(1) + "%" : "—"}</td>
      <td class="px-3 py-2 text-center">${s.min !== null ? s.min.toFixed(1) + "%" : "—"}</td>
      <td class="px-3 py-2">${statusBadge(s.avg)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function filterStudentsTable(query) {
  renderAllStudents(_allStudentsData, query);
}

// ============================================================
// PDF EXPORT
// ============================================================
async function exportToPdf() {
  const btn = document.getElementById("exportPdfBtn");
  if (btn) btn.textContent = "⏳ جارٍ التصدير…";
  try {
    const { jsPDF } = window.jspdf;
    const content = document.getElementById("reportContent");
    const canvas = await html2canvas(content, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#f8fafc",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    let pos = 0;
    const pageH = pdf.internal.pageSize.getHeight();
    let remaining = pdfH;
    while (remaining > 0) {
      pdf.addImage(imgData, "PNG", 0, -pos, pdfW, pdfH);
      remaining -= pageH;
      pos += pageH;
      if (remaining > 0) pdf.addPage();
    }
    const filename = `تقرير_الأداء_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error("PDF export error:", err);
    alert("تعذر تصدير PDF. حاول مرة أخرى.");
  } finally {
    if (btn) btn.textContent = "📄 تصدير PDF";
  }
}

// ============================================================
// UTILITIES
// ============================================================
function showLoading(show) {
  document.getElementById("loadingSpinner")?.classList.toggle("hidden", !show);
  document.getElementById("reportContent")?.classList.toggle("hidden", show);
}

function updatePeriodLabel(days) {
  const labels = { 7: "آخر 7 أيام", 30: "آخر 30 يوم", 90: "آخر 90 يوم", 365: "آخر سنة" };
  const el = document.getElementById("reportPeriodLabel");
  if (el) el.textContent = `تقرير ${labels[days] || `آخر ${days} يوم`}`;
}

function formatDateAr(date) {
  return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

