// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };