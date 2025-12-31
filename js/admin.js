// admin.js - Supabase-backed admin view
import { checkAuth, signOut, supabase } from "./auth.js";

const TEACHER_EMAIL = "kamel.fawwzia333@gmail.com";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Auth Guard (Admin Only)
    const user = await checkAuth({ protected: true, adminOnly: true }); 
    if (!user) return; // checkAuth handles redirect

    // 2. Init Admin UI
    initAdminPage(user);
});

function showAdminAlert(message, type = "success") {
  const box = document.getElementById("adminAlertBox");
  if (!box) return;
  if (!message) {
    box.textContent = "";
    box.classList.add("hidden");
    box.classList.remove("alert-error", "alert-success");
    return;
  }
  box.textContent = message;
  box.classList.remove("hidden", "alert-error", "alert-success");
  box.classList.add(type === "success" ? "alert-success" : "alert-error");
}

async function initAdminPage(user) {
    // Display Admin Info
    document.getElementById("adminName").textContent = user.name || user.email || "مشرف";
    document.getElementById("adminEmail").textContent = user.email || "";

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
             await signOut();
        });
    }

    // Load Data
    await loadUsersTable();
    await loadResultsTable();

    // Setup Role Change Listener
    const tbody = document.getElementById("usersTableBody");
    if (tbody) {
        tbody.addEventListener("change", async (e) => {
            const target = e.target;
            if (!target.classList.contains("role-select")) return;

            const uid = target.dataset.uid;
            const newRole = target.value;

            try {
                const { error } = await supabase
                    .from("profiles")
                    .update({ role: newRole })
                    .eq("id", uid);

                if (error) throw error;
                showAdminAlert("تم تحديث الدور بنجاح ✅", "success");
                await loadUsersTable(); // Reload to confirm
            } catch (err) {
                console.error(err);
                showAdminAlert("تعذر تحديث الدور. حاول مرة أخرى.", "error");
            }
        });
    }
}

async function loadUsersTable() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, role, name, class, student_number");

  if (error) {
    showAdminAlert("تعذر تحميل المستخدمين", "error");
    return;
  }

  users.forEach((u) => {
    const uid = u.id;
    const role = u.role || "user";

    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-4 py-2 text-right">${u.name || "-"}</td>
      <td class="px-4 py-2 text-right">${u.email || "-"}</td>
      <td class="px-4 py-2">
        <span class="inline-flex px-2 py-1 text-xs rounded-full ${
          role === "admin"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-700"
        }">
          ${role}
        </span>
      </td>
      <td class="px-4 py-2">
        <select class="role-select border rounded px-2 py-1 text-sm bg-white dark:bg-slate-800" data-uid="${uid}">
          <option value="user" ${role !== "admin" ? "selected" : ""}>user</option>
          <option value="admin" ${role === "admin" ? "selected" : ""}>admin</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadResultsTable() {
  const tbody = document.getElementById("resultsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Fetch attempts + student profiles
  const { data: attempts, error } = await supabase
    .from("attempts")
    .select("created_at, score_percentage, subject, level, user_id, student_name");

  if (error) {
    showAdminAlert("تعذر تحميل النتائج", "error");
    return;
  }

  // Get profiles to map names to IDs if needed (optimization: could use join in SB but manual is fine)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, class, student_number");

  const studentsMap = new Map();
  (profiles || []).forEach((u) => {
    studentsMap.set(u.id, u);
  });

  // Sort results new first
  attempts.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  attempts.forEach((r) => {
    const student = r.user_id ? studentsMap.get(r.user_id) || {} : {};
    const createdAt = new Date(r.created_at).toLocaleString("ar-EG");
    const score =
      typeof r.score_percentage === "number" ? r.score_percentage + "%" : "-";

    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-4 py-2 text-right">${student.name || r.student_name || "-"}</td>
      <td class="px-4 py-2 text-right">${student.class || "-"}</td>
      <td class="px-4 py-2 text-right">${student.student_number || "-"}</td>
      <td class="px-4 py-2 text-right">${r.subject || "-"}</td>
      <td class="px-4 py-2 text-right">${r.level || "-"}</td>
      <td class="px-4 py-2 text-right">${score}</td>
      <td class="px-4 py-2 text-right">${createdAt}</td>
    `;
    tbody.appendChild(tr);
  });
}
