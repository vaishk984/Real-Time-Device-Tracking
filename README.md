# Real-Time Device Tracker

A full-stack web application to track user device locations in real-time using **Google OAuth**, **Socket.IO**, and **MongoDB**, with secure session management and Dockerized deployment.

---

## Features

- **Google OAuth Authentication**  
  Secure login using Google Sign-In.

- **Live Location Tracking**  
  Real-time device location updates using Socket.IO and Leaflet.js.

- **Dashboard View**  
  View active users and their live positions on an interactive map.

- **Session Management**  
  Session persistence using `express-session` and secure cookies.

- **Dockerized Setup**  
  One-command setup using Docker and Docker Compose.

---

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Leaflet.js  
- **Backend**: Node.js, Express.js, Socket.IO  
- **Database**: MongoDB Atlas  
- **Authentication**: Passport.js with Google OAuth 2.0  
- **DevOps**: Docker, Docker Compose  
- **Hosting**: Render (Live demo)

---

## Getting Started (Local)

### 1. Clone the repository

```bash[
https://github.com/vaishk984/Real-Time-Device-Tracking.git
cd Real-Time-Device-Tracking
```

### 2. Clone the repository

```bash
MONGO_URI=your-mongodb-uri
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-secret-key
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### 3. Run with Docker
```bash
docker-compose up --build
```
Visit: http://localhost:3000

---

### Docker Setup
The app and MongoDB are containerized with Docker Compose.
```bash
# docker-compose.yml (snippet)
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGO_URI=...
      - GOOGLE_CLIENT_ID=...
      ...
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
```

### Live Demo
https://real-time-device-tracking-towf.onrender.com