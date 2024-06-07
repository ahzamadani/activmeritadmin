import {
  db,
  getDocs,
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
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
      row.innerHTML = `<td colspan="7" class="text-center">No activity logs found</td>`;
      eventTableBody.appendChild(row);
    } else {
      const events = [];

      for (const activityDoc of activitylogSnapshot.docs) {
        const activityData = activityDoc.data();
        const activityId = activityDoc.id;
        console.log("Activity ID:", activityId);

        if (!activityData.eventId) {
          console.log(`No eventId found for activity ID: ${activityId}`);
          const row = document.createElement("tr");
          row.innerHTML = `<td colspan="7" class="text-center">No eventId found for activity ID: ${activityId}</td>`;
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

            events.push({
              activityId,
              eventNumber: activityId.padStart(5, "0"),
              eventName: eventData.eventName || "N/A",
              date: eventData.date || "N/A",
              placeName: eventData.placeName || "N/A",
              merit: eventData.merit || "N/A",
              startTime: eventData.startTime || "",
              endTime: eventData.endTime || "",
              eventId,
              scannedUsers,
            });
          } else {
            console.log(`No event found for event ID: ${eventId}`);
            const row = document.createElement("tr");
            row.innerHTML = `<td colspan="7" class="text-center">No event found for event ID: ${eventId}</td>`;
            eventTableBody.appendChild(row);
          }
        } catch (innerError) {
          console.error(
            `Error fetching data for activity ID: ${activityId}`,
            innerError
          );
          const row = document.createElement("tr");
          row.innerHTML = `<td colspan="7" class="text-center">Error fetching data for activity ID: ${activityId} - ${innerError.message}</td>`;
          eventTableBody.appendChild(row);
        }
      }

      // Sort events by date (latest first)
      events.sort((a, b) => new Date(b.date) - new Date(a.date));

      events.forEach((event, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <th scope="row">${index + 1}</th>
          <td>${event.eventNumber}</td>
          <td>${event.eventName}</td>
          <td>${event.date}</td>
          <td>${event.placeName}</td>
          <td>${event.merit}</td>
          <td>
            <button class="btn btn-primary" onclick="showEventDetails('${
              event.eventId
            }', \`${event.scannedUsers}\`)">Details</button>
            <button class="btn btn-danger" onclick="deleteEvent('${
              event.eventId
            }', '${event.activityId}')"><i class="bi bi-trash"></i></button>
          </td>
        `;
        eventTableBody.appendChild(row);
      });

      if (!hasEntries) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="7" class="text-center">No entries found</td>`;
        eventTableBody.appendChild(row);
      }
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="7" class="text-center">Error fetching events: ${error.message}</td>`;
    eventTableBody.appendChild(row);
  }

  // Initialize the data table
  const dataTable = new simpleDatatables.DataTable(".datatable", {
    columns: [
      { select: 6, sortable: false }, // Disable sorting on 'Action' column
    ],
  });
});

window.showEventDetails = async (eventId, scannedUsers) => {
  const eventModal = new bootstrap.Modal(document.getElementById("eventModal"));
  const eventForm = document.getElementById("event-form");

  try {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();

      console.log("Event Data Fetched for Modal:", eventData);

      document.getElementById("eventName").value = eventData.eventName;
      document.getElementById("eventPlace").value = eventData.placeName;
      document.getElementById("eventDate").value = eventData.date;
      document.getElementById("startTime").value = eventData.startTime || "";
      document.getElementById("endTime").value = eventData.endTime || "";
      document.getElementById("meritScore").value = eventData.merit;
      document.getElementById("scannedUsers").value = scannedUsers;

      // Add event listeners to turn the text fields into time pickers on focus
      const startTimeInput = document.getElementById("startTime");
      const endTimeInput = document.getElementById("endTime");

      startTimeInput.addEventListener("focus", function () {
        this.type = "time";
      });

      endTimeInput.addEventListener("focus", function () {
        this.type = "time";
      });

      startTimeInput.addEventListener("blur", function () {
        if (!this.value) this.type = "text";
      });

      endTimeInput.addEventListener("blur", function () {
        if (!this.value) this.type = "text";
      });

      eventForm.onsubmit = async (e) => {
        e.preventDefault();

        const updatedEvent = {
          eventName: document.getElementById("eventName").value,
          placeName: document.getElementById("eventPlace").value,
          date: document.getElementById("eventDate").value,
          startTime: document.getElementById("startTime").value,
          endTime: document.getElementById("endTime").value,
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

window.deleteEvent = async (eventId, activityId) => {
  if (confirm("Are you sure you want to delete this event?")) {
    try {
      await deleteDoc(doc(db, "events", eventId));
      await deleteDoc(doc(db, "activitylog", activityId));
      alert("Event deleted successfully");
      location.reload(); // Reload the page to see the changes
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event: " + error.message);
    }
  }
};
