import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBUl9W-XXfpUjMqor6-sPepCdgUQclUCGY",
  authDomain: "wonder-pets-and-aqua.firebaseapp.com",
  projectId: "wonder-pets-and-aqua",
  storageBucket: "wonder-pets-and-aqua.firebasestorage.app",
  messagingSenderId: "327056129732",
  appId: "1:327056129732:web:6d1f7e3d52fe4461829391"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);






