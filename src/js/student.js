import { db, getDocs, collection, doc, getDoc } from "./firebaseauth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const studentTableBody = document.getElementById("student-table-body");
  const compareBtn = document.getElementById("compare-btn");
  const searchStudent1 = document.getElementById("search-student1");
  const searchStudent2 = document.getElementById("search-student2");
  const clearSearch1 = document.getElementById("clear-search1");
  const clearSearch2 = document.getElementById("clear-search2");
  const student1Details = document.getElementById("student1-details");
  const student2Details = document.getElementById("student2-details");
  const compareModal = new bootstrap.Modal(
    document.getElementById("compareModal")
  );
  const studentDetailsModal = new bootstrap.Modal(
    document.getElementById("studentDetailsModal")
  );
  const studentDetailsContainer = document.getElementById("student-details");

  let students = [];
  const studentDataCache = {};
  let student1Chart = null;
  let student2Chart = null;

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    let index = 1;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const matricNumber = userDoc.id;
      let totalMerit = 0;

      try {
        if (studentDataCache[matricNumber]) {
          totalMerit = studentDataCache[matricNumber].totalMerit;
        } else {
          const activityLogSnapshot = await getDocs(
            collection(db, "activitylog")
          );

          for (const activityDoc of activityLogSnapshot.docs) {
            const activityData = activityDoc.data();
            const activityId = activityDoc.id;

            const scannedUserDocRef = doc(
              db,
              `activitylog/${activityId}/scannedUser`,
              matricNumber
            );
            const scannedUserDoc = await getDoc(scannedUserDocRef);

            if (scannedUserDoc.exists() && activityData.eventId) {
              const eventDocRef = activityData.eventId;
              const eventDoc = await getDoc(eventDocRef);

              if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                totalMerit += parseInt(eventData.merit, 10) || 0;
              }
            }
          }

          studentDataCache[matricNumber] = {
            totalMerit,
          };
        }
      } catch (error) {
        console.error(
          `Error fetching activity logs for user ${matricNumber}:`,
          error
        );
      }

      const student = {
        index,
        name: userData.name || "N/A",
        college: userData.college || "N/A",
        gender: userData.gender || "N/A",
        matricNumber,
        totalMerit,
      };
      students.push(student);

      const row = document.createElement("tr");
      row.innerHTML = `
        <th scope="row">${index++}</th>
        <td>${student.name}</td>
        <td>${student.college}</td>
        <td>${student.gender}</td>
        <td>${student.matricNumber}</td>
        <td>${student.totalMerit}</td>
        <td><button class="btn btn-primary btn-sm details-btn" data-matric="${
          student.matricNumber
        }">Details</button></td>
      `;
      studentTableBody.appendChild(row);
    }

    new simpleDatatables.DataTable(".datatable");

    const searchStudent = async (
      input,
      detailsContainer,
      chartContainer,
      chartInstance
    ) => {
      input.addEventListener("input", async () => {
        const searchTerm = input.value.toLowerCase();
        const matchedStudent = students.find(
          (student) =>
            student.name.toLowerCase().includes(searchTerm) ||
            student.matricNumber.includes(searchTerm)
        );

        if (matchedStudent) {
          const userDoc = await getDoc(
            doc(db, "users", matchedStudent.matricNumber)
          );
          const userData = userDoc.data();

          detailsContainer.innerHTML = `
            <div class="card" style="flex: 1;">
              <div class="card-body">
                <h5 class="card-title">${matchedStudent.name}</h5>
                <p>College: ${matchedStudent.college}</p>
                <p>Gender: ${matchedStudent.gender}</p>
                <p>Age: ${userData.age || "N/A"}</p>
                <p>Email: ${userData.email || "N/A"}</p>
                <p>Phone: ${userData.phone || "N/A"}</p>
                <p>Matric: ${matchedStudent.matricNumber}</p>
              </div>
            </div>
            <div class="card" style="flex: 1;">
              <div class="card-body">
                <h5 class="card-title">Merit</h5>
                <p style="font-size: 2rem; color: green; text-align: center;">${
                  matchedStudent.totalMerit
                }</p>
              </div>
            </div>
          `;

          chartInstance = await renderMeritChart(
            matchedStudent.matricNumber,
            chartContainer,
            chartInstance
          );
        } else {
          detailsContainer.innerHTML = `<p>No student found</p>`;
          if (chartInstance) chartInstance.destroy();
        }
      });
    };

    searchStudent(
      searchStudent1,
      student1Details,
      "student1MeritChart",
      student1Chart
    );
    searchStudent(
      searchStudent2,
      student2Details,
      "student2MeritChart",
      student2Chart
    );

    clearSearch1.addEventListener("click", () => {
      searchStudent1.value = "";
      student1Details.innerHTML = "";
      if (student1Chart) student1Chart.destroy();
    });

    clearSearch2.addEventListener("click", () => {
      searchStudent2.value = "";
      student2Details.innerHTML = "";
      if (student2Chart) student2Chart.destroy();
    });

    compareBtn.addEventListener("click", () => {
      compareModal.show();
    });

    document.querySelectorAll(".details-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const matricNumber = event.target.dataset.matric;
        const matchedStudent = students.find(
          (student) => student.matricNumber === matricNumber
        );

        if (matchedStudent) {
          const userDoc = await getDoc(doc(db, "users", matricNumber));
          const userData = userDoc.data();

          const studentName = document.getElementById("studentName");
          const studentCollege = document.getElementById("studentCollege");
          const studentGender = document.getElementById("studentGender");
          const studentAge = document.getElementById("studentAge");
          const studentEmail = document.getElementById("studentEmail");
          const studentPhone = document.getElementById("studentPhone");
          const studentMatric = document.getElementById("studentMatric");
          const studentMerit = document.getElementById("studentMerit");

          if (studentName) studentName.textContent = userData.name || "N/A";
          if (studentCollege)
            studentCollege.textContent = `College: ${
              userData.college || "N/A"
            }`;
          if (studentGender)
            studentGender.textContent = `Gender: ${userData.gender || "N/A"}`;
          if (studentAge)
            studentAge.textContent = `Age: ${userData.age || "N/A"}`;
          if (studentEmail)
            studentEmail.textContent = `Email: ${userData.email || "N/A"}`;
          if (studentPhone)
            studentPhone.textContent = `Phone: ${userData.phone || "N/A"}`;
          if (studentMatric)
            studentMatric.textContent = `Matric: ${matchedStudent.matricNumber}`;
          if (studentMerit)
            studentMerit.textContent = matchedStudent.totalMerit;

          student1Chart = await renderMeritChart(
            matchedStudent.matricNumber,
            "studentMeritChart",
            student1Chart
          );
          studentDetailsModal.show();
        }
      });
    });

    document
      .getElementById("compareModal")
      .addEventListener("hidden.bs.modal", () => {
        searchStudent1.value = "";
        searchStudent2.value = "";
        student1Details.innerHTML = "";
        student2Details.innerHTML = "";
        if (student1Chart) student1Chart.destroy();
        if (student2Chart) student2Chart.destroy();
      });
  } catch (error) {
    console.error("Error fetching users:", error);
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="7" class="text-center">Error fetching users: ${error.message}</td>`;
    studentTableBody.appendChild(row);
  }
});

async function renderMeritChart(matricNumber, chartContainerId, chartInstance) {
  let meritData = {};

  try {
    const activityLogSnapshot = await getDocs(collection(db, "activitylog"));
    for (const activityDoc of activityLogSnapshot.docs) {
      const activityData = activityDoc.data();
      const activityId = activityDoc.id;

      const scannedUserDocRef = doc(
        db,
        `activitylog/${activityId}/scannedUser`,
        matricNumber
      );
      const scannedUserDoc = await getDoc(scannedUserDocRef);

      if (scannedUserDoc.exists() && activityData.eventId) {
        const eventDocRef = activityData.eventId;
        const eventDoc = await getDoc(eventDocRef);

        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          const eventDate = eventData.date.toDate
            ? eventData.date.toDate()
            : new Date(eventData.date);
          const month = eventDate.toISOString().slice(0, 7);

          if (!meritData[month]) {
            meritData[month] = 0;
          }
          meritData[month] += parseInt(eventData.merit, 10) || 0;
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching merit data for user ${matricNumber}:`, error);
  }

  const sortedMeritData = Object.keys(meritData)
    .sort()
    .map((month) => {
      return {
        x: new Date(month).getTime(),
        y: meritData[month],
      };
    });

  const options = {
    series: [
      {
        name: "Merit",
        data: sortedMeritData,
      },
    ],
    chart: {
      height: 350,
      type: "line",
      toolbar: {
        show: false,
        tools: {
          zoom: false, // Explicitly disable zooming functionality
        },
      },
      zoom: {
        enabled: false, // Disable zooming functionality
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
      colors: ["#2eca6a"],
    },
    markers: {
      size: 5,
      colors: ["#2eca6a"],
    },
    xaxis: {
      type: "datetime",
      labels: {
        format: "MMM 'yy",
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
    },
    tooltip: {
      x: {
        format: "MMM 'yy",
      },
      marker: {
        show: true,
        fillColors: ["#2eca6a"],
      },
    },
  };

  if (chartInstance) chartInstance.destroy();
  const chart = new ApexCharts(
    document.querySelector(`#${chartContainerId}`),
    options
  );
  chart.render();

  return chart;
}
