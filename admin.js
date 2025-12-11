// admin.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

const USERS_COLLECTION = "users";
const TEACHER_EMAIL = "kamel.fawwzia333@gmail.com";

async function getUserData(uid) {
  const ref = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

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

async function loadUsersTable() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const snap = await getDocs(collection(db, USERS_COLLECTION));

  snap.forEach((docSnap) => {
    const u = docSnap.data();
    const uid = docSnap.id;
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
        <select class="role-select border rounded px-2 py-1 text-sm" data-uid="${uid}">
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

  const studentsSnap = await getDocs(collection(db, "students"));
  const studentsMap = new Map();
  studentsSnap.forEach((docSnap) => {
    studentsMap.set(docSnap.id, docSnap.data());
  });

  const resultsSnap = await getDocs(collection(db, "results"));

  resultsSnap.forEach((docSnap) => {
    const r = docSnap.data();
    const student = r.uid ? studentsMap.get(r.uid) || {} : {};
    const createdAt =
      r.createdAt && typeof r.createdAt.toDate === "function"
        ? r.createdAt.toDate().toLocaleString("ar-EG")
        : "";
    const score =
      typeof r.scorePercentage === "number" ? r.scorePercentage + "%" : "-";

    const tr = document.createElement("tr");
    tr.className = "border-b border-slate-100";
    tr.innerHTML = `
      <td class="px-4 py-2 text-right">${student.name || r.studentName || "-"}</td>
      <td class="px-4 py-2 text-right">${student.class || "-"}</td>
      <td class="px-4 py-2 text-right">${student.number || "-"}</td>
      <td class="px-4 py-2 text-right">${r.subject || "-"}</td>
      <td class="px-4 py-2 text-right">${r.level || "-"}</td>
      <td class="px-4 py-2 text-right">${score}</td>
      <td class="px-4 py-2 text-right">${createdAt}</td>
    `;
    tbody.appendChild(tr);
  });
}

function initAdminPage() {
  const tbody = document.getElementById("usersTableBody");
  const logoutBtn = document.getElementById("logoutBtn");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    let me = await getUserData(user.uid);
    if (!me && user.email === TEACHER_EMAIL) {
      me = { name: user.displayName || user.email, email: user.email, role: "admin" };
    }

    if (!me || me.role !== "admin") {
      window.location.href = "dashboard.html";
      return;
    }

    const profileLink = document.getElementById("profileLink");
    if (profileLink) profileLink.href = "admin.html";

    document.getElementById("adminName").textContent = me.name || me.email || "مشرف";
    document.getElementById("adminEmail").textContent = me.email || "";
    await loadUsersTable();
    await loadResultsTable();
  });

  if (tbody) {
    tbody.addEventListener("change", async (e) => {
      const target = e.target;
      if (!target.classList.contains("role-select")) return;

      const uid = target.dataset.uid;
      const newRole = target.value;

      try {
        await updateDoc(doc(db, USERS_COLLECTION, uid), { role: newRole });
        showAdminAlert("تم تحديث الدور بنجاح ✅", "success");
        await loadUsersTable();
      } catch (err) {
        console.error(err);
        showAdminAlert("تعذر تحديث الدور. حاول مرة أخرى.", "error");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", initAdminPage);
