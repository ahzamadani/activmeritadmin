import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA61nNNT0ZzgUtVc_FAEckFzRO1RISt6ds",
  authDomain: "activ-merit.firebaseapp.com",
  databaseURL:
    "https://activ-merit-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "activ-merit",
  storageBucket: "activ-merit.appspot.com",
  messagingSenderId: "318671281005",
  appId: "1:318671281005:web:885e995067ec0047bd9864",
  measurementId: "G-ZQF3WYH3MX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  app,
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getDocs,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
};

// Function to handle login
export async function login(username, password) {
  try {
    const q = query(
      collection(db, "admins"),
      where("username", "==", username)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error("No user found with this username");
    }

    const userDoc = querySnapshot.docs[0];
    const email = userDoc.data().email;

    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error signing in: ", error);
    alert("Login failed: " + error.message);
  }
}

// Function to handle signup
export function signup(name, email, phone, admincollege, username, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("User created:", user);
      return setDoc(doc(db, "admins", user.uid), {
        name,
        email,
        phone,
        admincollege,
        username,
      });
    })
    .then(() => {
      const messageElement = document.createElement("div");
      messageElement.textContent =
        "Signup successful! Redirecting to login page...";
      messageElement.style.position = "fixed";
      messageElement.style.top = "20px";
      messageElement.style.left = "50%";
      messageElement.style.transform = "translateX(-50%)";
      messageElement.style.backgroundColor = "#28a745";
      messageElement.style.color = "#fff";
      messageElement.style.padding = "10px 20px";
      messageElement.style.borderRadius = "5px";
      document.body.appendChild(messageElement);

      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000); // Redirect after 3 seconds
    })
    .catch((error) => {
      console.error("Error signing up: ", error);
      alert("Signup failed: " + error.message);
    });
}

// Handle login form submission
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    login(username, password);
  });
}

// Handle signup form submission
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("input[name='name']").value;
    const email = document.querySelector("input[name='email']").value;
    const phone = document.querySelector("input[name='phone']").value;
    const admincollege = document.querySelector(
      "input[name='admincollege']"
    ).value;
    const username = document.querySelector("input[name='username']").value;
    const password = document.querySelector("input[name='password']").value;
    signup(name, email, phone, admincollege, username, password);
  });
}

// Handle sign out
const signOutButton = document.getElementById("sign-out");
if (signOutButton) {
  signOutButton.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "login.html";
    } catch (error) {
      console.error("Error signing out: ", error);
      alert("Sign out failed: " + error.message);
    }
  });
}
