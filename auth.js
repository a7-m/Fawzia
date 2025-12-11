// auth.js - Firebase Authentication logic for Fawzia school website
// Uses Firebase v9 modular SDK (ES modules)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ------------------------------
// Firebase Configuration
// ------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAS5JQrXf5YD0K6tPcpCjdY_BxjwPK2YZw",
  authDomain: "fawzia-1983.firebaseapp.com",
  projectId: "fawzia-1983",
  storageBucket: "fawzia-1983.firebasestorage.app",
  messagingSenderId: "868033763100",
  appId: "1:868033763100:web:2105ba0f2a709ea8110cd9",
  measurementId: "G-CCDSQEBEHN",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
// معلمة واحدة فقط – عدل البريد إذا لزم الأمر
const TEACHER_EMAIL = "kamel.fawwzia333@gmail.com";

// Helper: اختار الصفحة المناسبة حسب الدور
const redirectBasedOnRole = (user) => {
  if (!user) return "login.html";
  return user.email === TEACHER_EMAIL ? "admin.html" : "dashboard.html";
};

// Utility: Redirect helpers
const goTo = (path) => window.location.replace(path);

// Global: Update navbar profile link based on auth state
onAuthStateChanged(auth, (user) => {
  const link = document.getElementById("profileLink");
  if (link) {
    link.href = redirectBasedOnRole(user);
  }
});

// ------------------------------
// Page-specific logic dispatcher
// ------------------------------
const route = () => {
  const page = window.location.pathname.split("/").pop();

  switch (page) {
    case "login.html":
    case "":
      initLoginPage();
      break;
    case "signup.html":
      initSignupPage();
      break;
    case "forgot.html":
      initForgotPage();
      break;
    case "admin.html":
      initAdminPage();
      break;
    case "dashboard.html":
      initDashboardPage();
      break;
    default:
      // No specific auth handling
      break;
  }
};

document.addEventListener("DOMContentLoaded", route);

// ------------------------------
// Login Page
// ------------------------------
function initLoginPage() {
  // If user already logged in, redirect
  onAuthStateChanged(auth, (user) => {
    if (user) goTo(redirectBasedOnRole(auth.currentUser));
  });

  const loginForm = document.getElementById("loginForm");
  const googleBtn = document.getElementById("googleLogin");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        goTo(redirectBasedOnRole(auth.currentUser));
      } catch (err) {
        alert(getErrorMessage(err));
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        await signInWithPopup(auth, googleProvider);
        goTo(redirectBasedOnRole(auth.currentUser));
      } catch (err) {
        alert(getErrorMessage(err));
      }
    });
  }
}

// ------------------------------
// Signup Page
// ------------------------------
function initSignupPage() {
  onAuthStateChanged(auth, (user) => {
    if (user) goTo(redirectBasedOnRole(user));
  });

  const form = document.getElementById("signupForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const displayName = document.getElementById("studentName").value.trim();
    const studentClass = document.getElementById("studentClass").value.trim();
    const studentNumber = document.getElementById("studentNumber").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(user, { displayName });
      await setDoc(doc(db, "students", user.uid), {
        uid: user.uid,
        name: displayName,
        class: studentClass,
        number: studentNumber,
        email: user.email,
        createdAt: Date.now(),
      });
      goTo("profile.html");
    } catch (err) {
      alert(getErrorMessage(err));
    }
  });
}
  
// ------------------------------
// Forgot Password Page
// ------------------------------
function initForgotPage() {
  const form = document.getElementById("forgotForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("resetEmail").value.trim();

    try {
      await sendPasswordResetEmail(auth, email);
      alert("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
      goTo("login.html");
    } catch (err) {
      alert(getErrorMessage(err));
    }
  });
}

// ------------------------------
// Dashboard Page (Protected)
// ------------------------------
function initDashboardPage() {
  const logoutBtn = document.getElementById("logoutBtn");
  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");
  const roleEl = document.getElementById("userRole");
  const extraEl = document.getElementById("userExtra");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      goTo("login.html");
      return;
    }

    const isTeacher = user.email === TEACHER_EMAIL;

    if (nameEl) nameEl.textContent = user.displayName || user.email || "...";
    if (emailEl) emailEl.textContent = user.email || "";
    if (roleEl) roleEl.textContent = isTeacher ? "معلمة" : "طالب";

    if (!isTeacher) {
      try {
        const snap = await getDoc(doc(db, "students", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.name && nameEl) nameEl.textContent = data.name;
          if (extraEl) {
            const cls = data.class || "-";
            const num = data.number || "-";
            extraEl.textContent = `الصف: ${cls} 	 رقم الطالب: ${num}`;
          }
        }
      } catch (_) {
      }

      await loadStudentResults(user);
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      goTo("login.html");
    });
  }
}
  
async function loadStudentResults(user) {
  const tbody = document.getElementById("studentResultsBody");
  const emptyEl = document.getElementById("studentResultsEmpty");
  if (!tbody || !user) return;

  tbody.innerHTML = "";

  try {
    const qRef = query(
      collection(db, "results"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(qRef);

    if (snap.empty) {
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    snap.forEach((docSnap) => {
      const r = docSnap.data();
      const tr = document.createElement("tr");
      const createdAt = r.createdAt && typeof r.createdAt.toDate === "function" ? r.createdAt.toDate().toLocaleString("ar-EG") : "";
      const score = typeof r.scorePercentage === "number" ? r.scorePercentage + "%" : "-";

      tr.innerHTML = `
        <td class="px-4 py-2">${createdAt}</td>
        <td class="px-4 py-2">${r.subject || "-"}</td>
        <td class="px-4 py-2">${r.level || "-"}</td>
        <td class="px-4 py-2">${score}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    if (emptyEl) emptyEl.style.display = "block";
  }
}
  
// ------------------------------
// Profile Page (Protected)
// ------------------------------
function initProfilePage() {
  const logoutBtn = document.getElementById("logoutBtn");
  const nameEl = document.getElementById("profileName");
  const classEl = document.getElementById("profileClass");
  const numberEl = document.getElementById("profileNumber");

  onAuthStateChanged(auth, async (user) => {
    if (!user) return goTo("login.html");
    if (user.email === TEACHER_EMAIL) return goTo("dashboard.html");

    try {
      const snap = await getDoc(doc(db, "students", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (nameEl) nameEl.textContent = data.name || user.displayName || user.email;
        if (classEl) classEl.textContent = data.class || "-";
        if (numberEl) numberEl.textContent = data.number || "-";
      }
    } catch (_) {
      // ignore
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      goTo("login.html");
    });
  }
}

// ------------------------------
// Helper
// ------------------------------
function getErrorMessage(error) {
  const messageMap = {
    "auth/email-already-in-use": "هذا البريد مستخدم بالفعل.",
    "auth/invalid-email": "بريد إلكتروني غير صالح.",
    "auth/operation-not-allowed": "عملية غير مسموح بها.",
    "auth/weak-password": "كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف على الأقل.",
    "auth/user-disabled": "تم تعطيل هذا المستخدم.",
    "auth/user-not-found": "المستخدم غير موجود.",
    "auth/wrong-password": "كلمة المرور غير صحيحة.",
    "auth/popup-closed-by-user": "تم إغلاق نافذة تسجيل الدخول.",
  };
  return messageMap[error.code] || "حدث خطأ غير متوقع. حاول مرة أخرى.";
}
