import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCHNwQrOTrjRgroHJhyOaQRx0e8xrv006E",
  authDomain: "test-c167c.firebaseapp.com",
  projectId: "test-c167c",
  storageBucket: "test-c167c.firebasestorage.app",
  messagingSenderId: "951917385637",
  appId: "951917385637:web:4e9a28690c40db0731fa4c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
