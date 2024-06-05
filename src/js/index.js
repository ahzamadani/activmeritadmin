// Import necessary functions from firebaseauth.js
import { db, getDocs, collection, query, where } from "./firebaseauth.js";

// Function to fetch data from Firestore
async function fetchData() {
  try {
    // Fetch events count
    const eventsSnapshot = await getDocs(collection(db, "events"));
    const eventCount = eventsSnapshot.size;
    document.getElementById("eventCount").innerText = eventCount;

    // Fetch students count
    const studentsSnapshot = await getDocs(collection(db, "users"));
    const studentCount = studentsSnapshot.size;
    document.getElementById("studentCount").innerText = studentCount;

    // Fetch male students count
    const maleQuery = query(
      collection(db, "users"),
      where("gender", "==", "Male")
    );
    const maleSnapshot = await getDocs(maleQuery);
    const maleCount = maleSnapshot.size;
    document.getElementById("maleCount").innerText = maleCount;

    // Fetch female students count
    const femaleQuery = query(
      collection(db, "users"),
      where("gender", "==", "Female")
    );
    const femaleSnapshot = await getDocs(femaleQuery);
    const femaleCount = femaleSnapshot.size;
    document.getElementById("femaleCount").innerText = femaleCount;
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
}

// Fetch data on page load
window.addEventListener("load", fetchData);
