// indexchart.js
import { db, getDocs, collection, query, orderBy } from "./firebaseauth.js"; // Adjust the import path if needed

// Function to fetch event data from Firestore
async function fetchEventData() {
  try {
    const q = query(collection(db, "events"), orderBy("date"));
    const querySnapshot = await getDocs(q);

    const eventData = querySnapshot.docs.map((doc) => doc.data());
    const eventCountByMonth = processEventData(eventData);
    return eventCountByMonth;
  } catch (error) {
    console.error("Error fetching event data: ", error);
    return [];
  }
}

// Process data to count events by month
function processEventData(data) {
  const counts = {};
  data.forEach((event) => {
    const month = event.date.toDate().toISOString().slice(0, 7); // Extract 'YYYY-MM' format
    if (!counts[month]) {
      counts[month] = 0;
    }
    counts[month]++;
  });

  const sortedMonths = Object.keys(counts).sort();
  return sortedMonths.map((month) => ({
    x: new Date(month).getTime(),
    y: counts[month],
  }));
}

// Render the chart with the fetched data
async function renderChart() {
  const eventData = await fetchEventData();

  const options = {
    series: [
      {
        name: "Event",
        data: eventData,
      },
      {
        name: "Merit",
        data: [11, 32, 45, 32, 34, 52, 41], // Sample data for illustration
      },
      {
        name: "Students",
        data: [15, 11, 32, 18, 9, 24, 11], // Sample data for illustration
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
      categories: eventData.map((d) => d.x),
    },
    tooltip: {
      x: {
        format: "MMM yyyy",
      },
    },
  };

  const chart = new ApexCharts(
    document.querySelector("#reportsChart"),
    options
  );
  chart.render();
}

document.addEventListener("DOMContentLoaded", renderChart);
