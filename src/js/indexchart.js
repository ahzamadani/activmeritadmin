import { db } from "./firebaseauth.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const filterItems = document.querySelectorAll(".filter-item");
  filterItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      const filter = item.getAttribute("data-filter");
      updateChart(filter);
    });
  });

  updateChart("day"); // Default filter
});

async function fetchData(filter) {
  const eventsRef = collection(db, "events");
  const now = new Date();
  let q;

  // Create queries based on the filter
  if (filter === "day") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    q = query(eventsRef, where("date", ">=", today));
  } else if (filter === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    q = query(eventsRef, where("date", ">=", monthStart));
  } else if (filter === "year") {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    q = query(eventsRef, where("date", ">=", yearStart));
  }

  const querySnapshot = await getDocs(q);
  let eventData = [];
  let meritData = [];
  let studentData = [];

  for (const doc of querySnapshot.docs) {
    const event = doc.data();
    eventData.push(event.date);
    meritData.push(event.merit);

    // Fetch students for each event
    const eventActivityLogRef = collection(
      db,
      `activitylog/${doc.id}/scannedUser`
    );
    const activityLogSnapshot = await getDocs(eventActivityLogRef);
    studentData.push(activityLogSnapshot.size);
  }

  return { eventData, meritData, studentData };
}

function updateChart(filter) {
  fetchData(filter)
    .then(({ eventData, meritData, studentData }) => {
      const options = {
        series: [
          {
            name: "Event",
            data: eventData.map((date, index) => ({
              x: new Date(date),
              y: meritData[index], // Assuming data is for merits
            })),
          },
          {
            name: "Merit",
            data: meritData.map((merit, index) => ({
              x: new Date(eventData[index]),
              y: merit,
            })),
          },
          {
            name: "Students",
            data: studentData.map((students, index) => ({
              x: new Date(eventData[index]),
              y: students,
            })),
          },
        ],
        chart: {
          height: 350,
          type: "area",
          toolbar: {
            show: false,
          },
        },
        markers: {
          size: 4,
        },
        colors: ["#4154f1", "#2eca6a", "#ff771d"],
        fill: {
          type: "gradient",
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.3,
            opacityTo: 0.4,
            stops: [0, 90, 100],
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          curve: "smooth",
          width: 2,
        },
        xaxis: {
          type: "datetime",
          categories: eventData,
        },
        tooltip: {
          x: {
            format: "dd/MM/yy",
          },
        },
      };

      const chart = new ApexCharts(
        document.querySelector("#reportsChart"),
        options
      );
      chart.render();
    })
    .catch((error) => {
      console.error("Error fetching data: ", error);
      document.getElementById("error-message").textContent =
        "Error fetching data: " + error.message;
    });
}
