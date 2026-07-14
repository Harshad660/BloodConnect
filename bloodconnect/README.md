# BloodConnect — Real-Time Blood Donor Finder & Emergency SOS Platform

BloodConnect is a full-stack MERN (MongoDB, Express, React, Node) web application designed to solve the critical problem of slow, unorganized donor discovery during medical emergencies. 

Requesters can search for matching donors within a specific local radius, or broadcast an urgent **SOS Request** that instantly alerts matching donors in real time via WebSockets and falls back to mock emails if they are offline.

---

## Key Features

1. **Role-Based Authentication**:
   - **Donors**: Set blood group, location coordinates, availability statuses, view incoming SOS alerts, and accept/decline requests.
   - **Requesters**: Search nearby donors on a map, calculate distances in km, and broadcast emergency SOS alerts.
   - **Admins**: Vet donor profiles, toggle account verification badges, and moderate database listings.

2. **Geospatial Discovery & Maps**:
   - Uses MongoDB `$near` and `$geoWithin` queries with a `2dsphere` index to locate matching donors within a km-based radius.
   - Displays donor locations as interactive pins on an OpenStreetMap using Leaflet.js (`react-leaflet`).
   - Supports automated browser geolocation detection with manual coordinate pin-drop fallbacks.

3. **Real-Time SOS Alerts**:
   - Integrated with Socket.io. Broadcasting an SOS sends immediate in-app toast notifications to matching available donors' dashboards.
   - Fallback email integration using Nodemailer. Logs HTML email contents in the terminal for offline donors.

4. **Responsive Dashboards**:
   - Clean, red/white modern branding tailored for high contrast during emergencies.
   - Expandable drawer detail coordinates so requesters can contact accepted donors directly.

---

## Tech Stack

- **Frontend**: React (Vite), React Router v6, Axios, Tailwind CSS, Leaflet, Lucide-React, React-Hot-Toast
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT, bcryptjs
- **Notification fallback**: Nodemailer

---

## Directory Structure

```
bloodconnect/
├── backend/
│   ├── config/ (db.js)
│   ├── controllers/ (authController.js, donorController.js, sosController.js, adminController.js)
│   ├── middleware/ (auth.js, roleCheck.js)
│   ├── models/ (User.js, SOSRequest.js, Notification.js)
│   ├── routes/ (auth.js, donors.js, sos.js, admin.js)
│   ├── socket/ (socketHandler.js)
│   ├── seed.js
│   ├── server.js
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/ (MapPicker.jsx, Navbar.jsx, ProtectedRoute.jsx)
│   │   ├── context/ (AuthContext.jsx, SocketContext.jsx)
│   │   ├── pages/ (Landing.jsx, Login.jsx, Signup.jsx, Search.jsx, DonorDashboard.jsx, RequesterDashboard.jsx, CreateSOS.jsx, AdminDashboard.jsx)
│   │   ├── services/ (api.js)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Community Server running locally on port `27017`

### 1. Set Up the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Inspect or create the `.env` file based on `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/bloodconnect
   JWT_SECRET=bloodconnect_super_secret_key_12345
   EMAIL_USER=mock_email_user@example.com
   EMAIL_PASS=mock_email_password
   ```
3. Seed the database with 50 mock donor profiles across major cities:
   ```bash
   npm run seed
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server runs on port `5000` and initializes Socket.io.*

### 2. Set Up the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The frontend compiles and starts at `http://localhost:3000`.*

---

## Demo Test Credentials

To ease testing, the database seed script generates the following test accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@bloodconnect.org` | `admin123` | Can verify/delete donors and audit active requests |
| **Requester** | `requester@bloodconnect.org` | `password123` | Pre-configured in Bangalore; can search or post SOS |
| **Donor (O-)** | `donor1@bloodconnect.org` | `password123` | Pre-configured in Mumbai; available for requests |
| **Donor (AB-)** | `donor2@bloodconnect.org` | `password123` | Pre-configured in Delhi; available for requests |
| **Donor (B-)** | `donor3@bloodconnect.org` | `password123` | Pre-configured in Bangalore; available for requests |
| **Blood Bank** | `bank1@bloodconnect.org` | `bank123` | Pre-configured in Mumbai; can update inventory, manage donations |

*Any of the other seeded donors (`donor1@bloodconnect.org` through `donor50@bloodconnect.org`) can be accessed using password `password123`. Seeded blood banks (`bank1@bloodconnect.org` through `bank10@bloodconnect.org`) can be accessed using password `bank123`.*
