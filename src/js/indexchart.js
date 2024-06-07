// indexchart.js
import { db, getDocs, collection, query, orderBy } from "./firebaseauth.js"; // Adjust the import path if needed

// Function to fetch event data from Firestore
async function fetchEventData() {
  try {
    const q = query(collection(db, "events"), orderBy("date"));
    const querySnapshot = await getDocs(q);

    const eventData = querySnapshot.docs.map((doc) => doc.data());
    console.log("Fetched event data:", eventData); // Debugging log
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
  let minDate = new Date();
  let maxDate = new Date(0);

  // Collect counts and determine the date range
  data.forEach((event) => {
    const eventDate = event.date.toDate
      ? event.date.toDate()
      : new Date(event.date);
    const month = eventDate.toISOString().slice(0, 7); // Extract 'YYYY-MM' format
    if (!counts[month]) {
      counts[month] = 0;
    }
    counts[month]++;

    // Determine min and max dates
    if (eventDate < minDate) minDate = eventDate;
    if (eventDate > maxDate) maxDate = eventDate;
  });

  // Adjust maxDate to include the last month fully
  maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);

  // Generate all months within the date range
  const allMonths = [];
  let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);

  while (currentDate < endDate) {
    const month = currentDate.toISOString().slice(0, 7);
    allMonths.push({
      x: new Date(month).getTime(),
      y: counts[month] || 0,
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return allMonths;
}

// Render the chart with the fetched data
async function renderChart() {
  const eventData = await fetchEventData();

  console.log("Processed event data for chart:", eventData); // Debugging log

  const options = {
    series: [
      {
        name: "Event",
        data: eventData,
      },
    ],
    chart: {
      height: 350,
      type: "area",
      toolbar: {
        show: false, // Disables the entire toolbar, including zoom
        tools: {
          zoom: false, // Explicitly disable zooming functionality
        },
      },
    },
    markers: {
      size: 4,
    },
    colors: ["#4154f1"],
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
      labels: {
        format: "MMM 'yy",
        show: true,
      },
      tickAmount: 13, // Ensures all months are shown including December
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        formatter: function (val) {
          return Math.floor(val); // Ensure the count is an integer
        },
      },
    },
    tooltip: {
      x: {
        format: "MMM 'yy",
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
