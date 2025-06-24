const socket = io();
const activeUsersEl = document.getElementById("activeUsers");
const locationCountEl = document.getElementById("locationCount");
let locationCount = 0;

// User Auth Check (passed from EJS)
if (typeof USER_AUTHENTICATED !== "undefined" && USER_AUTHENTICATED) {
  if (navigator.geolocation) {
    let lastLat = null;
    let lastLng = null;
    const EPSILON = 0.0001;

    const isDifferent = (lat1, lng1, lat2, lng2) =>
      Math.abs(lat1 - lat2) > EPSILON || Math.abs(lng1 - lng2) > EPSILON;

    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, timestamp } = position.coords;

        if (accuracy > 100) {
          console.warn(
            "Ignoring inaccurate position. Accuracy:",
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
          console.log("Sending location:", {
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
        console.error("Geolocation error:", error);
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

// Map Initialization

const map = L.map("map").setView([0, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Track Markers and Trails
const markers = {};
const trails = {};
const paths = {};

// Receive Location

socket.on("receive-locations", (locations) => {
  // Clear all existing markers and trails first
  Object.values(markers).forEach((m) => map.removeLayer(m));
  Object.values(trails).forEach((t) => map.removeLayer(t));

  // Reset
  for (const key in markers) delete markers[key];
  for (const key in trails) delete trails[key];
  for (const key in paths) delete paths[key];

  locations.forEach((data) => {
    const { id, name, latitude, longitude } = data;

    markers[id] = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(
        `<strong>User:</strong> ${name}<br/>
         <strong>Lat:</strong> ${latitude.toFixed(5)}<br/>
         <strong>Lng:</strong> ${longitude.toFixed(5)}`
      );

    paths[id] = [[latitude, longitude]];

    trails[id] = L.polyline(paths[id], {
      color: "blue",
      weight: 3,
      opacity: 0.7,
    }).addTo(map);

    // Focus map on your own location
    if (id === socket.id) {
      map.setView([latitude, longitude], 16);
    }
  });

  map.invalidateSize();
});

// UI Updates

socket.on("active-users", (count) => {
  const el = document.getElementById("activeUsers");
  if (el) el.textContent = `Active users: ${count}`;
});

socket.on("location-count", (total) => {
  const el = document.getElementById("totalLocations");
  if (el) el.textContent = `Total updates: ${total}`;
});
