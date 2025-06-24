const socket = io();
const activeUsersEl = document.getElementById("activeUsers");
const locationCountEl = document.getElementById("locationCount");
let locationCount = 0;

// User Auth Check (passed from EJS)
if (typeof USER_AUTHENTICATED !== "undefined" && USER_AUTHENTICATED) {
  if (navigator.geolocation) {
    let lastLat = null;
    let lastLng = null;
    const EPSILON = 0.00001;

    const isDifferent = (lat1, lng1, lat2, lng2) =>
      Math.abs(lat1 - lat2) > EPSILON || Math.abs(lng1 - lng2) > EPSILON;

    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, timestamp } = position.coords;

        if (accuracy > 100) {
          console.warn(
            "⚠️ Ignoring inaccurate position. Accuracy:",
            accuracy,
            "m"
          );
          const warningEl = document.getElementById("locationWarning");
          if (warningEl) warningEl.style.display = "block";
          return;
        }

        const warningEl = document.getElementById("locationWarning");
        if (warningEl) warningEl.style.display = "none";

        if (
          lastLat === null ||
          isDifferent(latitude, longitude, lastLat, lastLng)
        ) {
          console.log("📡 Sending location:", {
            latitude,
            longitude,
            accuracy,
            timestamp: new Date(timestamp).toLocaleString(),
          });

          socket.emit("send-location", { latitude, longitude });

          lastLat = latitude;
          lastLng = longitude;

          const updateEl = document.getElementById("lastUpdated");
          if (updateEl) {
            updateEl.textContent =
              "Last updated: " + new Date().toLocaleTimeString();
          }
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        alert("Please allow location permission.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  } else {
    alert("Geolocation not supported.");
  }
} else {
  alert("Please login to start tracking.");
}

// -----------------
// Map Initialization
// -----------------
const map = L.map("map").setView([0, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Track Markers and Trails
const markers = {};
const trails = {};
const paths = {};

// -----------------
// Receive Location
// -----------------
socket.on("receive-location", (data) => {
  const { id, name, latitude, longitude } = data;

  console.log("📍 Received location from:", name, { latitude, longitude });

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(
        `<strong>User:</strong> ${name}<br/>
         <strong>Lat:</strong> ${latitude.toFixed(5)}<br/>
         <strong>Lng:</strong> ${longitude.toFixed(5)}`
      )
      .openPopup();
  }

  if (!paths[id]) paths[id] = [];
  paths[id].push([latitude, longitude]);
  if (paths[id].length > 50) paths[id].shift();

  if (trails[id]) {
    trails[id].setLatLngs(paths[id]);
  } else {
    trails[id] = L.polyline(paths[id], {
      color: "blue",
      weight: 3,
      opacity: 0.7,
    }).addTo(map);
  }

  if (id === socket.id) {
    map.setView([latitude, longitude], 16);
  }

  map.invalidateSize();
});

// -----------------
// UI Updates
// -----------------
socket.on("active-users", (count) => {
  const el = document.getElementById("activeUsers");
  if (el) el.textContent = `🟢 Active users: ${count}`;
});

socket.on("location-count", (total) => {
  const el = document.getElementById("totalLocations");
  if (el) el.textContent = `📍 Total updates: ${total}`;
});
