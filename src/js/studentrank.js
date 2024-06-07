import { db, getDocs, collection, doc, getDoc } from "./firebaseauth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const studentTableBody = document.getElementById("student-table-body");

  let students = [];

  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const activityLogSnapshot = await getDocs(collection(db, "activitylog"));

    const activityLogs = activityLogSnapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));

    const userDocs = usersSnapshot.docs;

    // Create an array of promises for fetching scanned users and event data
    const promises = userDocs.map(async (userDoc) => {
      const userData = userDoc.data();
      const matricNumber = userDoc.id;
      let totalMerit = 0;

      const scannedUserPromises = activityLogs.map(async (activityLog) => {
        const activityData = activityLog.data;
        const activityId = activityLog.id;

        const scannedUserSnapshot = await getDocs(
          collection(db, `activitylog/${activityId}/scannedUser`)
        );

        const eventPromises = scannedUserSnapshot.docs.map(
          async (scannedUserDoc) => {
            if (scannedUserDoc.id === matricNumber && activityData.eventId) {
              const eventDocRef = activityData.eventId; // This is a DocumentReference
              const eventDoc = await getDoc(eventDocRef);

              if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                totalMerit += parseInt(eventData.merit, 10) || 0; // Ensure merit is treated as an integer
              }
            }
          }
        );

        await Promise.all(eventPromises);
      });

      await Promise.all(scannedUserPromises);

      return {
        name: userData.name || "N/A",
        college: userData.college || "N/A",
        matricNumber,
        totalMerit,
      };
    });

    // Wait for all promises to resolve
    students = await Promise.all(promises);

    // Sort students by totalMerit in descending order and get the top 5
    students.sort((a, b) => b.totalMerit - a.totalMerit);
    students = students.slice(0, 5);

    // Display the top 5 students
    students.forEach((student, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <th scope="row">${index + 1}</th>
        <td>${student.name}</td>
        <td>${student.matricNumber}</td>
        <td>${student.college}</td>
        <td class="fw-bold">${student.totalMerit}</td>
      `;
      studentTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" class="text-center">Error fetching users: ${error.message}</td>`;
    studentTableBody.appendChild(row);
  }
});
