import { db, getDocs, collection, doc, getDoc } from "./firebaseauth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const studentTableBody = document.getElementById("student-table-body");
  const compareBtn = document.getElementById("compare-btn");
  const searchStudent1 = document.getElementById("search-student1");
  const searchStudent2 = document.getElementById("search-student2");
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

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    let index = 1;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const matricNumber = userDoc.id;
      let totalMerit = 0;

      try {
        // Fetch the activity logs
        const activityLogSnapshot = await getDocs(
          collection(db, "activitylog")
        );
        for (const activityDoc of activityLogSnapshot.docs) {
          const activityData = activityDoc.data();
          const activityId = activityDoc.id;

          // Check if the user scanned this activity
          const scannedUserDocRef = doc(
            db,
            `activitylog/${activityId}/scannedUser`,
            matricNumber
          );
          const scannedUserDoc = await getDoc(scannedUserDocRef);

          if (scannedUserDoc.exists() && activityData.eventId) {
            // Fetch the event document to get the merit value using the eventId field
            const eventDocRef = activityData.eventId; // This is a DocumentReference
            const eventDoc = await getDoc(eventDocRef);

            if (eventDoc.exists()) {
              const eventData = eventDoc.data();
              totalMerit += parseInt(eventData.merit, 10) || 0; // Ensure merit is treated as an integer
            }
          }
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

    // Initialize the data table
    new simpleDatatables.DataTable(".datatable");

    const searchStudent = async (input, detailsContainer) => {
      input.addEventListener("input", async () => {
        const searchTerm = input.value.toLowerCase();
        const matchedStudent = students.find(
          (student) =>
            student.name.toLowerCase().includes(searchTerm) ||
            student.matricNumber.includes(searchTerm)
        );

        if (matchedStudent) {
          detailsContainer.innerHTML = `
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">${matchedStudent.name}</h5>
                <p>College: ${matchedStudent.college}</p>
                <p>Gender: ${matchedStudent.gender}</p>
                <p>Matric: ${matchedStudent.matricNumber}</p>
                <p>Merit: ${matchedStudent.totalMerit}</p>
              </div>
            </div>
          `;
        } else {
          detailsContainer.innerHTML = `<p>No student found</p>`;
        }
      });
    };

    searchStudent(searchStudent1, student1Details);
    searchStudent(searchStudent2, student2Details);

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
          studentDetailsContainer.innerHTML = `
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">${matchedStudent.name}</h5>
                <p>College: ${matchedStudent.college}</p>
                <p>Gender: ${matchedStudent.gender}</p>
                <p>Matric: ${matchedStudent.matricNumber}</p>
                <p>Merit: ${matchedStudent.totalMerit}</p>
              </div>
            </div>
          `;

          studentDetailsModal.show();
        }
      });
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="7" class="text-center">Error fetching users: ${error.message}</td>`;
    studentTableBody.appendChild(row);
  }
});
