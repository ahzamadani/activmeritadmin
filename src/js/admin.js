import { auth, db } from "./firebaseauth.js";
import {
  getDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

// Function to fetch admin profile data
export function fetchAdminProfile() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "admins", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data fetched: ", userData);

        // Update profile name
        const profileNameElements = document.querySelectorAll(
          "#profile-name, #admin-name, #dropdown-admin-name"
        );
        profileNameElements.forEach((element) => {
          if (element) {
            element.textContent = userData.name;
          }
        });

        // Update other profile fields
        if (document.getElementById("profile-email")) {
          document.getElementById("profile-email").textContent = userData.email;
        }
        if (document.getElementById("profile-phone")) {
          document.getElementById("profile-phone").textContent = userData.phone;
        }
        if (document.getElementById("profile-college")) {
          document.getElementById("profile-college").textContent =
            userData.admincollege;
        }
      } else {
        console.log("No such document!");
      }
    } else {
      console.log("User is not signed in");
      window.location.href = "login.html";
    }
  });
}

// Automatically fetch admin profile data on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchAdminProfile();
});

// Function to update admin profile data
export function updateAdminProfile(updates) {
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, "admins", user.uid);
    getDoc(userRef)
      .then((userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Merge existing data with updates
          const updatedData = { ...userData, ...updates };
          return updateDoc(userRef, updatedData);
        }
      })
      .then(() => {
        alert("Updated Successfully");
        fetchAdminProfile(); // Refresh profile data
      })
      .catch((error) => {
        console.error("Error updating profile: ", error);
        alert("Update Failed, Please try again: " + error.message);
      });
  } else {
    console.log("User is not signed in");
    window.location.href = "login.html";
  }
}

// Handle profile edit form submission
const profileEditForm = document.getElementById("profile-edit-form");
if (profileEditForm) {
  profileEditForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const updates = {};
    const name = document.getElementById("profileEditName").value;
    const email = document.getElementById("profileEditEmail").value;
    const phone = document.getElementById("profileEditPhone").value;
    const admincollege = document.getElementById("profileEditCollege").value;

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (admincollege) updates.admincollege = admincollege;

    updateAdminProfile(updates);
  });
}
