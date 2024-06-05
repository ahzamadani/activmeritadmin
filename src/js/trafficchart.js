import { db } from "./firebaseauth.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const collegeCounts = {
      Cempaka: 0,
      Allamanda: 0,
      "Bunga Raya": 0,
      "Tunku Abdul Razak": 0,
      Sakura: 0,
    };

    // Fetch users data from Firestore
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    querySnapshot.forEach((doc) => {
      const user = doc.data();
      if (collegeCounts[user.college] !== undefined) {
        collegeCounts[user.college]++;
      }
    });

    // Check if data was fetched correctly
    const collegeNames = Object.keys(collegeCounts);
    const collegeData = Object.values(collegeCounts);

    if (collegeData.every((count) => count === 0)) {
      throw new Error("No data fetched or all colleges have zero users.");
    }

    // Initialize and set options for the donut chart
    const options = {
      series: collegeData,
      chart: {
        type: "donut",
      },
      labels: collegeNames,
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    };

    const chart = new ApexCharts(
      document.querySelector("#trafficChart"),
      options
    );
    chart.render();
    document.getElementById("error-message").textContent =
      "Data fetched and chart rendered successfully.";
  } catch (error) {
    console.error("Error fetching data: ", error);
    document.getElementById("error-message").textContent =
      "Error fetching data: " + error.message;
  }
});
