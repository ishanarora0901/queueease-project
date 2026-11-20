# 🎓 QueueEase – Smart Campus Service Management System

> **Tagline:** *"Skip the Wait, Manage Your Campus Services Smartly."*

[![Live Demo](https://img.shields.io/badge/Live_Demo-QueueEase_Online-0D9488?style=for-the-badge&logo=render&logoColor=white)](https://queueease-project.onrender.com/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-ishanarora0901%2Fqueueease--project-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ishanarora0901/queueease-project)
[![MERN Stack](https://img.shields.io/badge/Stack-MERN_%2B_Socket.io-4F46E5?style=for-the-badge)](https://github.com/ishanarora0901/queueease-project)

---

## 🌐 Live Application Link

🚀 **Production Live URL:** [https://queueease-project.onrender.com/](https://queueease-project.onrender.com/)  
🏛️ **Dedicated Admin Portal:** [https://queueease-project.onrender.com/admin/login](https://queueease-project.onrender.com/admin/login)

### 🔑 Pre-Configured Demo Accounts (Ready to Test):

| Role | Name | Email | Password | What You Can Test |
|---|---|---|---|---|
| **Student** | Aarav Patel | `student@queueease.edu` | `Student@123` | Book live tokens, track queue position, request CAD certificates, pay fees |
| **Admin** | Dr. Vikram Singhania | `admin@queueease.edu` | `Admin@123` | Executive dashboard, live queue overrides, user management, audit logs |
| **Admission Prof.** | Prof. Arvind Mehta | `fees.officer@queueease.edu` | `Staff@123` | Counter 1 Calling, Admission & Fee appointments |
| **CAD Officer** | Mrs. Sunita Verma | `cad.officer@queueease.edu` | `Staff@123` | Counter 2 Calling, review & approve CAD certificate requests |
| **Faculty Head** | Prof. Rajiv Sharma | `prof.sharma@queueease.edu` | `Staff@123` | Computer Science HOD student consultation bookings |

---

## 🌟 Key Modules & Features

### 1. Smart Queue Management System
- **Self-Service Token Booking:** Students choose department, counter, service type, and preferred time window online.
- **Cryptographic QR Pass:** Instant digital token generation with verifiable QR code for presentation at service counters.
- **Live Queue Tracking:** Real-time queue position countdown, estimated waiting time calculation, and turn approaching alerts.
- **Queue Actions:** Seamless token cancellation, rescheduling, and request to rejoin missed turns.
- **Staff Counter Operations:** One-click "Call Next Token" with instant sound chime & socket notification, skip turn, mark no-show, and mark served.
- **Built-in QR Scanner:** Front-facing and back-facing camera QR scanner for counter officers to verify student passes instantly.

### 2. Live Counter Availability Management
- Real-time status for every campus desk: `Open`, `Closed`, `On Lunch Break`, `Temporarily Unavailable`, `Staff Absent`, `Holiday`, `Maintenance`.
- Automated lunch break scheduling with expected reopening time broadcasts.
- Automatic student alerts when counters become unavailable with suggested alternative counters.

### 3. Faculty & Staff Availability & Appointments
- Searchable faculty directory with department filtering.
- Cabin location, working hours, scheduled consultation slots, and live availability toggles (`Available`, `Busy in Meeting`, `Lunch Break`, `On Leave`).
- Online student appointment booking with instant faculty notifications and calendar management.

### 4. College Administrative Department (CAD) Module
- Online applications for **Bonafide Certificate**, **Character Certificate**, **No Dues Certificate**, **Official Transcripts**, **ID Card Requests**, and **Migration Certificates**.
- Multi-step status lifecycle: `Submitted` ➔ `Under Review` ➔ `Approved` ➔ `Ready for Collection` ➔ `Completed`.
- Instant digital PDF certificate generation with university header, authorized seal, and validation QR.
- Physical collection appointment booking with QR-based verification at the CAD collection desk.

### 5. Online Fee Counter & Payments
- Itemized fee breakdown for Tuition, Examinations, Library, Hostel, and CAD processing fees.
- Integrated payment gateway supporting UPI (GPay/PhonePe/Paytm), Debit/Credit Cards, and Net Banking.
- Automated generation of official digital fee receipt PDFs with itemized breakdown, transaction ID, and verification QR code.
- Confetti celebration upon dues clearance and complete payment history.

### 6. Dedicated Administrator Console (`/admin`)
- Accessible strictly via `/admin` and `/admin/login` with role-based access control (RBAC).
- Comprehensive KPIs: Total Students, Staff, Active Counters, Today's Tokens, Pending CAD Applications, Total Collections.
- Interactive Recharts analytics: Hourly peak queue curves, department service volume distribution.
- Campus-wide User Management (CRUD for students & faculty, status suspension, role assignment).
- Department & Counter configuration with operating schedules and holiday management.
- Campus-wide Queue Oversight with administrative manual overrides and audit logging.
- Security and compliance audit log viewer tracking all system operations with IP addresses and timestamps.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM v6, Axios, Lucide React, Recharts, Canvas-Confetti, QRCode.react, HTML5-QRCode |
| **Backend** | Node.js, Express.js, Socket.io (Real-time WebSockets), JWT (Access & Refresh Token Rotation), PDFKit, QRCode, Multer, Helmet, Morgan, CORS |
| **Database** | MongoDB Atlas with Mongoose ODM (includes robust zero-config in-memory fallback for offline testing) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on v24.18.1)
- **npm** v9+ (tested on v11.16.0)

### 2. Clone and Setup Environment

```bash
# Clone the repository
git clone https://github.com/ishanarora0901/queueease-project.git
cd queueease-project

# Configure Server Environment Variables
cp server/.env.example server/.env
```

Edit `server/.env` with your settings (optional if testing with the default demo mode):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/queueease?retryWrites=true&w=majority
JWT_SECRET=queueease_jwt_secret_key_super_secure_2026_dev
JWT_REFRESH_SECRET=queueease_jwt_refresh_secret_key_super_secure_2026_dev
CLIENT_URL=http://localhost:5173
```

### 3. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 4. (Optional) Seed MongoDB Atlas Database
If you provided a live MongoDB Atlas URI in `server/.env`:
```bash
cd server
npm run seed
```

### 5. Run the Application

In terminal 1 (Backend API & Sockets):
```bash
cd server
npm run dev
# Server listening on http://localhost:5000
```

In terminal 2 (Frontend Client):
```bash
cd client
npm run dev
# Client ready on http://localhost:5173
```

Open your browser at **`http://localhost:5173`**!

---

## 👥 Pre-Configured Demo Accounts (1-Click Login)

The login pages include convenient **One-Click Demo Fillers**:

| Role | Name | Email | Password | Identifier / Office |
|---|---|---|---|---|
| **Student** | Aarav Patel | `student@queueease.edu` | `Student@123` | Roll: `CS2023089` (Sem 4, B.Tech CSE) |
| **Staff (Faculty)** | Prof. Rajiv Sharma | `prof.sharma@queueease.edu` | `Staff@123` | Head, Computer Science & Engineering |
| **Staff (CAD Officer)** | Mrs. Sunita Verma | `cad.officer@queueease.edu` | `Staff@123` | Senior Officer, CAD Desk (Counter 2) |
| **Staff (Accounts Officer)** | Mr. Arvind Mehta | `fees.officer@queueease.edu` | `Staff@123` | Senior Accounts Officer (Counter 1) |
| **Admin** | Dr. Vikram Singhania | `admin@queueease.edu` | `Admin@123` | Dean of Student Affairs & Chief Admin |

> 🔒 **Admin Portal Access:** Navigating to `/admin` or `/admin/login` gives access to the separate executive console. Normal students and staff cannot access this section.

---

## 📡 RESTful API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` – Student registration
- `POST /api/auth/login` – Student and staff login
- `POST /api/auth/admin/login` – Strictly verified admin login
- `POST /api/auth/refresh-token` – Refresh JWT access token
- `GET  /api/auth/me` – Retrieve active user profile

### Queue Management (`/api/queue`)
- `GET   /api/queue/student/active` – Student's active waiting & called tokens
- `GET   /api/queue/student/history` – Student's past token bookings
- `POST  /api/queue/book` – Book digital queue token with QR pass
- `PATCH /api/queue/:id/cancel` – Cancel token booking
- `PATCH /api/queue/:id/reschedule` – Reschedule token to another date/slot
- `PATCH /api/queue/:id/rejoin` – Rejoin queue after a missed turn
- `GET   /api/queue/counter/:counterId` – Counter queue backlog (Staff)
- `POST  /api/queue/counter/:counterId/call-next` – Call next student in line (Staff)
- `PATCH /api/queue/:id/status` – Mark served, skipped, or no-show (Staff)
- `POST  /api/queue/verify-qr` – Scan and verify student QR pass (Staff)

### Counters (`/api/counters`)
- `GET   /api/counters` – List all active counters with live availability
- `GET   /api/counters/:id` – Counter details and assigned officer
- `PATCH /api/counters/:id/status` – Update counter status (Open, Lunch Break, etc.)

### Faculty & Appointments (`/api/staff`)
- `GET   /api/staff` – Faculty directory with search & availability status
- `PATCH /api/staff/availability` – Update faculty availability status and notes
- `POST  /api/staff/appointments/book` – Book student consultation appointment
- `GET   /api/staff/appointments/student` – Student's booked appointments
- `GET   /api/staff/appointments/staff` – Faculty's consultation schedule
- `PATCH /api/staff/appointments/:id/status` – Confirm, complete, or cancel appointment

### CAD Document Services (`/api/cad`)
- `GET   /api/cad/my-applications` – Student's certificate applications
- `POST  /api/cad/apply` – Submit new application with document attachments
- `GET   /api/cad/all` – Review all CAD applications (Staff)
- `PATCH /api/cad/:id/status` – Approve, reject, or mark ready for collection
- `GET   /api/cad/download/:appNumber` – Download official certified PDF
- `POST  /api/cad/verify-collection-qr` – Verify physical collection QR pass

### Fee Counter & Payments (`/api/payments`)
- `GET  /api/payments/fee-status` – Itemized dues and payment summary
- `POST /api/payments/order` – Initiate payment transaction
- `POST /api/payments/verify` – Server-side payment verification
- `GET  /api/payments/receipt/:receiptNumber` – Download digital PDF fee receipt
- `GET  /api/payments/transactions` – Full payment ledger (Staff & Admin)

### Dedicated Administrator Console (`/api/admin`)
- `GET    /api/admin/metrics` – Executive KPI counters and analytics charts
- `GET    /api/admin/users` – User management list
- `POST   /api/admin/users` – Create student or staff account
- `PATCH  /api/admin/users/:id` – Update user status (active/suspended)
- `DELETE /api/admin/users/:id` – Remove user account
- `POST   /api/admin/departments` – Create department
- `POST   /api/admin/counters` – Create counter
- `GET    /api/admin/queues` – Campus-wide queue oversight
- `PATCH  /api/admin/tokens/:id/override` – Administrative manual token override
- `GET    /api/admin/audit-logs` – Cryptographic security audit records

---

## 🌐 Production Deployment Guide

### Frontend Deployment (Vercel)
1. Push the code to GitHub.
2. In Vercel, import the repository and set **Root Directory** to `client`.
3. Set Build Command: `npm run build` and Output Directory: `dist`.
4. Add environment variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://queueease-api.onrender.com`).

### Backend Deployment (Render / Railway)
1. In Render or Railway, create a new Web Service pointing to the repository.
2. Set **Root Directory** to `server`.
3. Set Build Command: `npm install` and Start Command: `npm start`.
4. Configure Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Random 64-character secret.
   - `JWT_REFRESH_SECRET`: Random 64-character secret.
   - `CLIENT_URL`: Your deployed frontend URL.
5. Run `npm run seed` once to populate initial demo data on Atlas.

---

## 📄 License
This project is open-source under the MIT License.
Developed for modern university campuses and administrative excellence.

