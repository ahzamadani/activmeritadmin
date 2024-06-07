// indexchart.js
import { db, getDocs, collection, query, orderBy } from "./firebaseauth.js"; // Adjust the import path if needed

// Function to fetch event data from Firestore
async function fetchEventData() {
  try {
    const q = query(collection(db, "events"), orderBy("date"));
    const querySnapshot = await getDocs(q);

    const eventData = querySnapshot.docs.map((doc) => doc.data());
    console.log("Fetched event data:", eventData); // Debugging log
    const { eventCountByMonth, meritCountByMonth } =
      processEventData(eventData);
    return { eventCountByMonth, meritCountByMonth };
  } catch (error) {
    console.error("Error fetching event data: ", error);
    return { eventCountByMonth: [], meritCountByMonth: [] };
  }
}

// Process data to count events and merits by month
function processEventData(data) {
  const eventCounts = {};
  const meritCounts = {};
  let minDate = new Date();
  let maxDate = new Date(0);

  // Collect counts and determine the date range
  data.forEach((event) => {
    const eventDate = event.date.toDate
      ? event.date.toDate()
      : new Date(event.date);
    const month = eventDate.toISOString().slice(0, 7); // Extract 'YYYY-MM' format
    if (!eventCounts[month]) {
      eventCounts[month] = 0;
      meritCounts[month] = 0;
    }
    eventCounts[month]++;
    meritCounts[month] += event.merit ? parseFloat(event.merit) : 0; // Ensure merit is a number

    console.log(
      `Processing event: date=${eventDate}, month=${month}, merit=${event.merit}`
    ); // Debugging log

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
      y: eventCounts[month] || 0,
      merit: meritCounts[month] || 0,
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const eventCountByMonth = allMonths.map(({ x, y }) => ({ x, y }));
  const meritCountByMonth = allMonths.map(({ x, merit }) => ({ x, y: merit }));

  console.log("Event counts by month:", eventCountByMonth); // Debugging log
  console.log("Merit counts by month:", meritCountByMonth); // Debugging log

  return { eventCountByMonth, meritCountByMonth };
}

// Render the chart with the fetched data
async function renderChart() {
  const { eventCountByMonth, meritCountByMonth } = await fetchEventData();

  console.log("Processed event data for chart:", eventCountByMonth); // Debugging log
  console.log("Processed merit data for chart:", meritCountByMonth); // Debugging log

  const options = {
    series: [
      {
        name: "Event",
        data: eventCountByMonth,
      },
      {
        name: "Merit",
        data: meritCountByMonth,
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
      zoom: {
        enabled: false, // Disable zooming functionality
      },
    },
    markers: {
      size: 4,
    },
    colors: ["#4154f1", "#2eca6a"], // Different color for the merit series
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
      tickAmount: 15, // Ensures all months are shown including December
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
