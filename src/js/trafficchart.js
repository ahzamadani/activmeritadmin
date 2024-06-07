// trafficchart.js
import { db, getDocs, collection } from "./firebaseauth.js"; // Adjust the import path if needed

// Function to fetch college data from Firestore
async function fetchCollegeData() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const collegeCounts = {
      Cempaka: 0,
      "Bunga Raya": 0,
      Sakura: 0,
      Allamanda: 0,
      "Tunku Abdul Razak": 0,
    };

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (collegeCounts[userData.college] !== undefined) {
        collegeCounts[userData.college]++;
      }
    });

    return Object.keys(collegeCounts).map((college) => ({
      value: collegeCounts[college],
      name: college,
    }));
  } catch (error) {
    console.error("Error fetching college data: ", error);
    return [];
  }
}

// Render the pie chart with the fetched data
async function renderChart() {
  const collegeData = await fetchCollegeData();

  const options = {
    tooltip: {
      trigger: "item",
    },
    legend: {
      top: "5%",
      left: "center",
    },
    series: [
      {
        name: "Access From",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "18",
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: collegeData,
      },
    ],
  };

  const chart = echarts.init(document.querySelector("#trafficChart"));
  chart.setOption(options);
}

document.addEventListener("DOMContentLoaded", renderChart);
