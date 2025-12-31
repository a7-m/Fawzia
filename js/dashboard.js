import { checkAuth, signOut, supabase } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Check Auth (Blocks access if not logged in)
    const user = await checkAuth({ protected: true }); // Returns cached user
    if (!user) return; // checkAuth handles redirect

    // 2. Initialize Page
    initDashboard(user);
});

async function initDashboard(user) {
    // DOM Elements
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");
    const roleEl = document.getElementById("userRole");
    const extraEl = document.getElementById("userExtra");
    const logoutBtn = document.getElementById("logoutBtn");

    // Display Info
    if (nameEl) nameEl.textContent = user.name || user.email;
    if (emailEl) emailEl.textContent = user.email;
    if (roleEl) roleEl.textContent = user.isTeacher ? "معلم / مشرف" : "طالب";

    if (!user.isTeacher) {
        if (extraEl) {
            extraEl.textContent = `الصف: ${user.class || "-"} \t رقم الطالب: ${user.number || "-"}`;
        }
        await loadStudentResults(user.uid);
    } else {
        if (extraEl) extraEl.textContent = "حساب معلم - يمكنك الوصول لوحة التحكم";
    }

    // Logout Handler
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
             await signOut();
        });
    }
}

async function loadStudentResults(userId) {
    const tbody = document.getElementById("studentResultsBody");
    const emptyEl = document.getElementById("studentResultsEmpty");
    if (!tbody) return;

    tbody.innerHTML = "";

    const { data: attempts, error } = await supabase
        .from("attempts")
        .select("created_at, score_percentage, subject, level")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error || !attempts || attempts.length === 0) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    attempts.forEach((r) => {
        const tr = document.createElement("tr");
        const dateStr = new Date(r.created_at).toLocaleString("ar-EG");
        const score = typeof r.score_percentage === "number" ? r.score_percentage + "%" : "-";

        tr.innerHTML = `
            <td class="px-4 py-2">${dateStr}</td>
            <td class="px-4 py-2">${r.subject || "-"}</td>
            <td class="px-4 py-2">${r.level || "-"}</td>
            <td class="px-4 py-2 font-bold text-emerald-600">${score}</td>
        `;
        tbody.appendChild(tr);
    });
}
