const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const sharedsession = require("express-socket.io-session");
require("dotenv").config();
require("./passport");
const Location = require("./models/Locations");

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// Setup session
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
});

app.use(cookieParser());
app.use(sessionMiddleware);

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// Middlewares
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

io.use(
  sharedsession(sessionMiddleware, {
    autoSave: true,
  })
);

// Google OAuth routes
app.get("/", (req, res) => res.render("index", { user: req.user }));
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => res.redirect("/")
);
app.get("/logout", (req, res) => req.logout(() => res.redirect("/")));
app.get("/dashboard", ensureAuth, (req, res) => {
  res.render("dashboard", { user: req.user });
});

// Location history
app.get("/history", async (req, res) => {
  const locations = await Location.find().sort({ timestamp: -1 }).limit(100);
  res.render("history", { locations });
});

// Share session with socket.io
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

// Track socket-user mapping
const userMap = new Map();

io.on("connection", (socket) => {
  const session = socket.request.session;
  const user = session?.passport?.user;

  console.log(
    "🧠 New socket connection. User:",
    user?.displayName || "Unknown"
  );

  if (user) userMap.set(socket.id, user);

  socket.on("send-location", async (data) => {
    const user = userMap.get(socket.id);

    if (!user) {
      console.warn(" Unauthorized attempt to send location");
      return; // Don't allow unauthenticated users
    }

    const location = new Location({
      email: user.emails[0].value,
      name: user.displayName,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date(),
    });

    await location.save();

    io.emit("receive-location", {
      id: socket.id,
      name: user.displayName,
      email: user.emails[0].value,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  });

  socket.on("user-disconnected", (id) => {
    if (markers[id]) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
    if (trails[id]) {
      map.removeLayer(trails[id]);
      delete trails[id];
    }
    delete paths[id];
  });

  socket.on("disconnect", () => {
    const user = userMap.get(socket.id);
    if (user) {
      io.emit("user-disconnected", socket.id);
      userMap.delete(socket.id);
    }

    io.emit("user-disconnected", socket.id);
  });
});

// Start server
server.listen(3000, () =>
  console.log("🚀 Server running on http://localhost:3000")
);
