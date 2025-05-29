import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDBxlU2CBF52azieEuDDYaxT9mP6xGVsNc",
    authDomain: "git-hackathon-3d6fa.firebaseapp.com",
    projectId: "git-hackathon-3d6fa",
    storageBucket: "git-hackathon-3d6fa.firebasestorage.app",
    messagingSenderId: "484351024463",
    appId: "1:484351024463:web:91a8bf88ae04975a0ef93a",
    measurementId: "G-D5681H88KP"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Wait for the DOM to fully load
window.addEventListener('DOMContentLoaded', () => {
  const googleLoginDiv = document.getElementById('google-login');
  const googleSignupDiv = document.getElementById('google-signup');

  if (googleLoginDiv) {
    googleLoginDiv.addEventListener('click', handleGoogleAuth);
  }

  if (googleSignupDiv) {
    googleSignupDiv.addEventListener('click', handleGoogleAuth);
  }

  function handleGoogleAuth() {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log("Logged in as:", user.displayName, user.email);
        alert(`Welcome ${user.displayName}!`);
        // Optional: redirect or update UI here
      })
      .catch((error) => {
        console.error("Google sign-in error:", error.message);
        alert("Google sign-in failed. Please try again.");
      });
  }
});
