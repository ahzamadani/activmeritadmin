import {
  db,
  getDocs,
  collection,
  doc,
  getDoc,
  updateDoc,
} from "./firebaseauth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const eventTableBody = document.getElementById("event-table-body");
  let hasEntries = false;

  try {
    const activitylogSnapshot = await getDocs(collection(db, "activitylog"));
    console.log("Activity Logs:", activitylogSnapshot.size);

    if (activitylogSnapshot.empty) {
      console.log("No activity logs found.");
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="6" class="text-center">No activity logs found</td>`;
      eventTableBody.appendChild(row);
    } else {
      for (const activityDoc of activitylogSnapshot.docs) {
        const activityData = activityDoc.data();
        const activityId = activityDoc.id;
        console.log("Activity ID:", activityId);

        if (!activityData.eventId) {
          console.log(`No eventId found for activity ID: ${activityId}`);
          const row = document.createElement("tr");
          row.innerHTML = `<td colspan="6" class="text-center">No eventId found for activity ID: ${activityId}</td>`;
          eventTableBody.appendChild(row);
          continue;
        }

        const eventId = activityData.eventId.id; // Assuming eventId is a DocumentReference
        console.log("Event ID:", eventId);

        try {
          const scannedUsersSnapshot = await getDocs(
            collection(db, `activitylog/${activityId}/scannedUser`)
          );
          let scannedUsers = "";
          scannedUsersSnapshot.forEach((doc) => {
            scannedUsers += `${doc.id}\n`;
          });

          console.log("Scanned Users:", scannedUsers);

          // Check the event ID and document
          const eventDocRef = doc(db, "events", eventId);
          console.log(`Fetching event for ID: ${eventId}`);
          const eventDoc = await getDoc(eventDocRef);

          if (eventDoc.exists()) {
            hasEntries = true;
            const eventData = eventDoc.data();
            console.log("Event Data:", eventData);

            const row = document.createElement("tr");
            row.innerHTML = `
              <th scope="row">${activityId}</th>
              <td>${eventData.eventName || "N/A"}</td>
              <td>${eventData.date || "N/A"}</td>
              <td>${eventData.placeName || "N/A"}</td>
              <td>${eventData.merit || "N/A"}</td>
              <td><button class="btn btn-primary" onclick="showEventDetails('${eventId}', \`${scannedUsers}\`)">Details</button></td>
            `;
            eventTableBody.appendChild(row);
          } else {
            console.log(`No event found for event ID: ${eventId}`);
            const row = document.createElement("tr");
            row.innerHTML = `<td colspan="6" class="text-center">No event found for event ID: ${eventId}</td>`;
            eventTableBody.appendChild(row);
          }
        } catch (innerError) {
          console.error(
            `Error fetching data for activity ID: ${activityId}`,
            innerError
          );
          const row = document.createElement("tr");
          row.innerHTML = `<td colspan="6" class="text-center">Error fetching data for activity ID: ${activityId} - ${innerError.message}</td>`;
          eventTableBody.appendChild(row);
        }
      }

      if (!hasEntries) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="6" class="text-center">No entries found</td>`;
        eventTableBody.appendChild(row);
      }
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="6" class="text-center">Error fetching events: ${error.message}</td>`;
    eventTableBody.appendChild(row);
  }

  // Initialize the data table
  new simpleDatatables.DataTable(".datatable");
});

window.showEventDetails = async (eventId, scannedUsers) => {
  const eventModal = new bootstrap.Modal(document.getElementById("eventModal"));
  const eventForm = document.getElementById("event-form");

  try {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();

      document.getElementById("eventName").value = eventData.eventName;
      document.getElementById("eventPlace").value = eventData.placeName;
      document.getElementById("eventDate").value = eventData.date;
      document.getElementById("meritScore").value = eventData.merit;
      document.getElementById("scannedUsers").value = scannedUsers;

      eventForm.onsubmit = async (e) => {
        e.preventDefault();

        const updatedEvent = {
          eventName: document.getElementById("eventName").value,
          placeName: document.getElementById("eventPlace").value,
          date: document.getElementById("eventDate").value,
          merit: document.getElementById("meritScore").value,
        };

        try {
          await updateDoc(doc(db, "events", eventId), updatedEvent);
          alert("Event updated successfully");
          eventModal.hide();
          location.reload(); // Reload the page to see the changes
        } catch (error) {
          console.error("Error updating event:", error);
          alert("Failed to update event: " + error.message);
        }
      };

      eventModal.show();
    } else {
      console.log(`No event found for ID: ${eventId}`);
    }
  } catch (error) {
    console.error("Error fetching event details:", error);
  }
};
