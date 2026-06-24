import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// SIGNUP
window.signup = function () {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if (!email || !password) {
    alert("Fill all fields");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      localStorage.setItem("loggedInUser", email);
      window.location.replace("index.html");
    })
    .catch(err => alert(err.message));
};

// LOGIN
window.login = function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Fill all fields");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      localStorage.setItem("loggedInUser", email);
      window.location.replace("index.html");
    })
    .catch(err => alert(err.message));
};
