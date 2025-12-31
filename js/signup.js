import { checkAuth, signUp, pagePath, supabase } from "./auth.js";

// Guard: Redirect if already logged in
document.addEventListener("DOMContentLoaded", async () => {
    await checkAuth({ protected: false });
    await initSignup();
});

async function initSignup() {
    const roleSelect = document.getElementById("role");
    const studentFields = document.getElementById("studentFields");
    const classSelect = document.getElementById("studentClass");
    const numberInput = document.getElementById("studentNumber");
    const form = document.getElementById("signupForm");

    // Load classes for student dropdown
    try {
        const { data, error } = await supabase.from("classes").select("id, name, grade").order("name", { ascending: true });
        if (error) throw error;
        if (classSelect) {
            classSelect.innerHTML = "";
            (data || []).forEach((c) => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = `${c.name}${c.grade ? ` (الصف ${c.grade})` : ""}`;
                classSelect.appendChild(opt);
            });
        }
    } catch (err) {
        console.error("Error loading classes", err);
        alert("تعذر تحميل قائمة الصفوف. حاول لاحقاً.");
    }

    // Toggle Fields based on Role
    roleSelect.addEventListener("change", () => {
        if (roleSelect.value === "teacher") {
            studentFields.classList.add("hidden");
            classSelect.removeAttribute("required");
            numberInput.removeAttribute("required");
        } else {
            studentFields.classList.remove("hidden");
            classSelect.setAttribute("required", "true");
            numberInput.setAttribute("required", "true");
        }
    });

    // Handle Submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("studentName").value.trim();
        const email = document.getElementById("signupEmail").value.trim();
        const password = document.getElementById("signupPassword").value;
        const confirmPass = document.getElementById("confirmPassword").value;
        const role = roleSelect.value;
        
        const cls = role === "student" ? classSelect.value?.trim() : null;
        const num = role === "student" ? numberInput.value.trim() : null;

        if (password !== confirmPass) {
            alert("كلمات المرور غير متطابقة.");
            return;
        }

        try {
            await signUp(email, password, {
                name: name,
                role: role,
                class_id: cls,
                student_number: num
            });
            alert("تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.");
            window.location.href = pagePath("auth/login.html");
        } catch (err) {
            console.error(err);
            if (err.message.includes("already registered")) {
                alert("هذا البريد الإلكتروني مسجل بالفعل.");
            } else {
                alert("حدث خطأ أثناء التسجيل: " + err.message);
            }
        }
    });
}
