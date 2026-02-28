import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD-mK36enlRpManm8lhM4L5xO9_m62joEo",
  authDomain: "meditrack-d10f7.firebaseapp.com",
  projectId: "meditrack-d10f7",
  storageBucket: "meditrack-d10f7.firebasestorage.app",
  messagingSenderId: "57870392206",
  appId: "1:57870392206:web:b558f3c0fb1e37eaefe2df",
  measurementId: "G-63X3VSY68N"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Export các công cụ để dùng trong app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;