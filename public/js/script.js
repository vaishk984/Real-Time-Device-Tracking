const socket = io();

// Watch user’s location and emit it to server
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude });
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }
  );
} else {
  alert("Geolocation is not supported by your browser.");
}

// Initialize map centered at 0,0 initially
const map = L.map("map").setView([0, 0], 10); // 2 for world view initially

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Track all active markers by socket ID
const markers = {};

// Receive location data from server
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;

  // Update marker or create new one
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(`User: ${id}`)
      .openPopup();
  }

  // Center map on current user’s marker
  if (id === socket.id) {
    map.setView([latitude, longitude], 16);
  }
});

// Remove marker when a user disconnects
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
