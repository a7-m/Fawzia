// Centralized Auth Module (Supabase + Role-aware redirects)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- Path Helpers ---
const pagesPrefix = (() => {
  const marker = "/pages/";
  const path = window.location.pathname;
  const idx = path.indexOf(marker);
  if (idx === -1) return "pages/"; // from root (e.g., index.html)
  const after = path.slice(idx + marker.length);
  const depth = after.split("/").length - 1; // how deep inside /pages/**
  return "../".repeat(depth);
})();

export const pagePath = (subpath) => `${pagesPrefix}${subpath}`;
export const LOGIN_PAGE = pagePath("auth/login.html");
export const COMPLETE_PROFILE_PAGE = pagePath("auth/complete-profile.html");
export const ADMIN_PROFILE_PAGE = pagePath("profiles/admin.html");
export const TEACHER_PROFILE_PAGE = pagePath("profiles/teacher.html");
export const STUDENT_PROFILE_PAGE = pagePath("profiles/student.html");
export const OAUTH_REDIRECT = `${window.location.origin}/${LOGIN_PAGE.replace(/^\.\//, "")}`;

// --- Supabase Client ---
const SUPABASE_URL = window.env?.SUPABASE_URL || "https://wpzbbapmpdfnyhevchty.supabase.co";
const SUPABASE_ANON_KEY =
  window.env?.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwemJiYXBtcGRmbnloZXZjaHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTAzNTgsImV4cCI6MjA4MTQyNjM1OH0.mqG0HBrVXP839ZvQoIzA1wSOLp-OYfg-rwVkOXXfKe0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
export const auth = supabase.auth;

// --- Helpers ---
export const roleLanding = (role) => {
  if (role === "admin") return ADMIN_PROFILE_PAGE;
  if (role === "teacher") return TEACHER_PROFILE_PAGE;
  return STUDENT_PROFILE_PAGE;
};

const isProfileComplete = (profile, teacherClasses = []) => {
  if (!profile) return false;
  const role = profile.role?.trim();
  const fullName = profile.full_name?.trim() || profile.name?.trim();
  if (!role || !fullName) return false;
  if (role === "student") return !!profile.class_id;
  if (role === "teacher") return teacherClasses.length > 0;
  return true; // admin
};

let cachedUser = null;

export function getCurrentUser() {
  return cachedUser;
}

export async function refreshCachedUser(session) {
  if (!session?.user) {
    cachedUser = null;
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, name, class_id")
    .eq("id", session.user.id)
    .maybeSingle();

  let teacherClasses = [];
  if (profile?.role === "teacher") {
    const { data: tData } = await supabase
      .from("teacher_classes")
      .select("class_id, classes(id, name, grade)")
      .eq("teacher_id", session.user.id);
    teacherClasses = (tData || []).map((row) => ({
      class_id: row.class_id,
      class: row.classes || null,
    }));
  }

  let classInfo = null;
  if (profile?.class_id) {
    const { data: cls } = await supabase
      .from("classes")
      .select("id, name, grade")
      .eq("id", profile.class_id)
      .maybeSingle();
    classInfo = cls || null;
  }

  const profileComplete = isProfileComplete(profile, teacherClasses);
  const role = profile?.role || "student";
  const fullName = profile?.full_name || profile?.name || session.user.email;

  cachedUser = {
    uid: session.user.id,
    email: session.user.email,
    emailConfirmed: !!session.user.email_confirmed_at,
    role,
    isAdmin: role === "admin",
    isTeacher: role === "teacher",
    name: fullName,
    classId: profile?.class_id || null,
    classInfo,
    teacherClasses,
    profileComplete,
    hasProfile: !!profile,
  };
  return cachedUser;
}

export function onAuthStateChanged(_auth, callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      cachedUser = null;
      callback(null);
      return;
    }
    refreshCachedUser(session).then((user) => callback(user));
  });
}

// --- Auth Actions ---
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return await refreshCachedUser(data.session);
}

export async function signUp(email, password, metadata = {}) {
  const redirectTo = `${window.location.origin}/${LOGIN_PAGE.replace(/^\.\//, "")}`;
  const userMetadata = {
    name: metadata.full_name || metadata.name || "",
    role: metadata.role || "student",
    class_id: metadata.class_id || metadata.classId || null,
    student_number: metadata.student_number || metadata.studentNumber || null,
  };

  // Pass metadata to Supabase (helps server-side triggers) and use absolute redirect URL
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
      emailRedirectTo: redirectTo,
    },
  });
  if (error) throw error;

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      role: metadata.role || "student",
      full_name: metadata.full_name || metadata.name || "",
      class_id: metadata.class_id || null,
    });
  }
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
  cachedUser = null;
  window.location.replace(LOGIN_PAGE);
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: LOGIN_PAGE,
  });
  if (error) throw error;
}

// --- Auth Guard ---
/**
 * @param {Object} options
 * @param {boolean} options.protected - requires login
 * @param {boolean} options.adminOnly - restrict to admin
 * @param {boolean} options.allowUnconfirmed - allow unconfirmed emails
 * @param {boolean} options.requireProfileComplete - enforce profile completeness
 */
export async function checkAuth(options = { protected: true, adminOnly: false, allowUnconfirmed: false, requireProfileComplete: true }) {
  const { data: { session } } = await supabase.auth.getSession();
  await refreshCachedUser(session);
  const user = cachedUser;
  const currentPage = window.location.pathname.split("/").pop();
  const requireProfileComplete = options.requireProfileComplete !== false;

  if (!user && options.protected) {
    window.location.replace(LOGIN_PAGE);
    return null;
  }

  // Already logged in and on public auth page
  if (user && !options.protected && (currentPage === "login.html" || currentPage === "signup.html")) {
    if (requireProfileComplete && !user.profileComplete && currentPage !== "complete-profile.html") {
      window.location.replace(COMPLETE_PROFILE_PAGE);
      return user;
    }
    window.location.replace(roleLanding(user.role));
    return user;
  }

  if (!user) return null;

  // Profile completion enforcement
  if (requireProfileComplete && !user.profileComplete && currentPage !== "complete-profile.html") {
    window.location.replace(COMPLETE_PROFILE_PAGE);
    return null;
  }

  if (options.protected && !options.allowUnconfirmed && !user.emailConfirmed) {
    alert("يرجى تأكيد بريدك الإلكتروني لتسجيل الدخول.");
    await supabase.auth.signOut();
    window.location.replace(LOGIN_PAGE);
    return null;
  }

  if (options.adminOnly && !user.isAdmin) {
    alert("غير مصرح لك بالدخول لهذه الصفحة.");
    window.location.replace(roleLanding(user.role));
    return user;
  }

  updateNavbar(user);
  return user;
}

// --- UI Helpers ---
function updateNavbar(user) {
  const profileLink = document.getElementById("profileLink");
  if (profileLink) {
    profileLink.href = user ? roleLanding(user.role) : LOGIN_PAGE;
  }
}

// keep navbar synced on auth events
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    cachedUser = null;
    updateNavbar(null);
  } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    refreshCachedUser(session).then((u) => updateNavbar(u));
  }
});
