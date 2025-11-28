// auth.js
// يعتمد على firebase compat (سهلة الاستخدام مع GitHub Pages)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAS5JQrXf5YD0K6tPcpCjdY_BxjwPK2YZw",
  authDomain: "fawzia-1983.firebaseapp.com",
  projectId: "fawzia-1983",
  storageBucket: "fawzia-1983.firebasestorage.app",
  messagingSenderId: "868033763100",
  appId: "1:868033763100:web:2105ba0f2a709ea8110cd9",
  measurementId: "G-CCDSQEBEHN"
};

// تهيئة
if(!window.firebaseAppInitialized){
  firebase.initializeApp(firebaseConfig);
  window.firebaseAppInitialized = true;
}
const auth = firebase.auth();

// دوال مساعدة
async function signupWithEmail(email, password, profile = {}) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  if(profile.displayName){
    await cred.user.updateProfile({displayName: profile.displayName});
  }
  return cred.user;
}

async function loginWithEmail(email, password) {
  const userCred = await auth.signInWithEmailAndPassword(email, password);
  // سيتم تشغيل onAuthStateChanged تلقائياً
  return userCred.user;
}

async function sendPasswordReset(email){
  return auth.sendPasswordResetEmail(email);
}

async function signOutUser(){
  return auth.signOut();
}

// onAuthState: لتحديث واجهاتك وحماية الصفحات
function onAuthState(cb){
  auth.onAuthStateChanged(user => {
    cb(user);
    // إذا سجلنا دخولاً، نوجه المستخدم إلى dashboard.html (ما لم نكن بالفعل في صفحة dashboard)
    const path = location.pathname.split('/').pop();
    if(user){
      if(path === 'login.html' || path === 'signup.html' || path === '') {
        // توجيه ذكي
        if(location.pathname.includes('signup.html')) location.href = 'dashboard.html';
        else if(location.pathname.includes('login.html')) location.href = 'dashboard.html';
        else if(location.pathname === '/' || path === '') location.href = 'dashboard.html';
      }
    } else {
      // إذا لم يكن المستخدم مسجلًا وحاول الوصول لصفحة محمية (مث: dashboard.html) نعيده للـ login
      if(path === 'dashboard.html'){
        location.href = 'login.html';
      }
    }
  });
}

// expose functions for inline scripts
window.signupWithEmail = signupWithEmail;
window.loginWithEmail = loginWithEmail;
window.sendPasswordReset = sendPasswordReset;
window.signOutUser = signOutUser;
window.onAuthState = onAuthState;

// حافظ على استمرار الجلسة (الافتراضي على الويب)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.warn);
