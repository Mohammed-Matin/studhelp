# StudHelp — Presentation Content

---

## Google Form: Problem Statement

College club events are scattered across countless WhatsApp groups, making it impossible for students to track everything. Club management is chaotic — registrations, members, budgets, and communication lack a unified system. Team formation and peer collaboration remain fragmented without a centralized identity platform.

---

## Google Form: Your Solution

A centralized college ecosystem where students discover & register for all club events in one place, clubs manage members/budgets/gallery/dashboard seamlessly, users create teams & chat privately with verified college mates, all secured by bonafide-based authentication.

---

## Google Form: Key Features

- **Bonafide-Verified Auth** – Only legitimate students via admin-verified document upload
- **Club Dashboard** – Full CRUD, member roles, budget tracking, gallery, analytics
- **Smart Event Hub** – Create, register, calendar view, team participation, organizer management
- **Private Chat** – Real-time DM & role-based group chats with college mates
- **Team Engine** – Form teams per event, invite members, manage participation
- **Anonymous Interaction** – Send anonymous messages to clubs & users
- **Real-time Notifications** – Instant alerts for events, follows, registrations

---

## PPT Slide-by-Slide Content

### Slide 1: Title Slide
- **Project Name:** StudHelp
- **Team Members:** Matin Shaikh(Leader), Priyansh Parekh, Sravanthi Vadla, Shreya Parmar 
- **College:** SVNIT

### Slide 2: Problem Statement
- Event info scattered across WhatsApp groups
- No centralized club/event/team management
- No official peer-to-peer communication platform
- No verified student identity system

### Slide 3: Existing Gaps
- No unified event registration platform
- No official chat with verified college mates
- No club dashboard for budget, members, gallery management
- No verified identity — anyone can impersonate

### Slide 4: Our Solution
- PERN stack platform with:
  - Verified student authentication (bonafide upload)
  - Club hub (create, manage, follow)
  - Event registry (create, register, calendar)
  - Team builder (invite, manage, participate)
  - Private & group real-time chat

### Slide 5: Tech Stack (PERN)

| Letter | Technology | Description |
|--------|-----------|-------------|
| **P** | **PostgreSQL** (NeonDB) | Cloud-native relational database with 16 tables, 7 enums, and raw parameterized SQL queries for zero-ORM security |
| **E** | **Express v5** | Lightweight async-first REST API framework handling 50+ endpoints across 6 resource modules with Zod validation |
| **R** | **React 19 + Vite** | Modern component-driven SPA with Tailwind v4 styling, Three.js 3D backgrounds, and real-time Socket.io integration |
| **N** | **Node.js + Socket.io** | Event-driven runtime powering simultaneous RESTful APIs and real-time bidirectional chat & notification engine |

### Slide 6: Architecture Diagram
- **Frontend:** React 19 + Vite + Tailwind v4 → Axios API calls
- **Backend:** Express v5 REST API + Socket.io
- **Database:** PostgreSQL on NeonDB (serverless)
- **Media Storage:** Cloudinary (avatars, bonafide, gallery)
- **Auth:** JWT (7-day expiry) + bcrypt password hashing

### Slide 7: Database Design
- **Schema:** `student`
- **16 Tables:** users, Clubs, Club_Members, Club_Followers, Club_Gallery_Images, Club_Join_Requests, Follower_Messages, Budget_Transactions, Club_Donations, Events, Event_Organizers, Event_Registrations, Teams, Team_Members, Messages, Notifications
- **7 Enums:** user_role, user_status, degree_type, gender_type, club_role, event_status, team_member_status

### Slide 8: Authentication Flow
1. Student registers with details + bonafide certificate upload (Cloudinary)
2. Admin reviews bonafide document
3. Admin approves (VERIFIED) or rejects (REJECTED)
4. Verified user gets JWT token, accesses all features
5. PENDING users cannot access platform features
6. Token auto-rotation on 401 via axios interceptor

### Slide 9: Key Feature — Clubs
- Create clubs with logo, cover, description
- 6 member roles: CORE_COMMITTEE, EXECUTIVE, TECHNICAL, DESIGN, PUBLICITY, ADMINISTRATIVE_SPONSORS
- Follow/unfollow clubs
- Gallery with image uploads (Cloudinary)
- Budget tracking with INCOME/EXPENSE transactions
- Join requests with approval workflow
- Follower messaging with admin replies
- Dashboard with stats & analytics

### Slide 10: Key Feature — Events
- Full CRUD with title, description, banner, time, location
- 5 statuses: UPCOMING, LIVE, PAST, POSTPONED, CANCELLED
- Participation types: SOLO or TEAM
- Organizers (cannot register for their own event)
- Registration & unregistration
- Calendar view (monthly grouped by upcoming/live/past)
- Time clash detection
- Postpone & cancel workflows

### Slide 11: Key Feature — Chat
- Real-time DM with college mates (Socket.io rooms)
- Role-based club group chats (CLUB_{id} rooms)
- Event & team group chats
- Anonymous message sending
- User search by username/name
- Message persistence in DB

### Slide 12: Key Feature — Teams
- Create teams per event (leader = creator)
- Invite college mates to team
- Member statuses: INVITED, JOINED, DECLINED, DROPPED
- Remove team members
- Only team members can participate in team-based events

### Slide 13: Notifications
- Real-time push via Socket.io
- Types: event created, club followed, event registration
- Persistent in DB with read/unread status
- Notification bell in UI with unread count
- Mark single/all as read

### Slide 14: Live Demo
- Register with bonafide → Login
- Browse all clubs
- View club page (gallery, members, events, about)
- Create event
- Register for event
- Chat with college mate
- Create team & invite members
- Calendar view

### Slide 15: Challenges & Learnings
- **Raw SQL complexity** — Writing and maintaining complex JOIN queries across 16 tables without an ORM
- **Socket.io room management** — Managing dynamic rooms for DMs, clubs, events, teams
- **Cloudinary integration** — Multipart form data + streaming uploads with Multer
- **Role-based access control** — 6 club roles × multiple permissions per endpoint
- **Express v5** — New async error handling patterns

### Slide 16: Future Scope
- Email & push notifications
- Password reset / forgot password
- Rate limiting on auth endpoints
- Mobile responsive design
- CI/CD pipeline & Docker deployment
- Unit & integration tests

### Slide 17: Q&A
- Thank you!

---

## Tech Stack — One-Liner Each (PERN)

| Letter | Technology | One-Liner |
|--------|-----------|-----------|
| **P** | **PostgreSQL** (NeonDB) | Cloud-native relational database with 16 tables, 7 enums, and raw parameterized SQL queries for zero-ORM security |
| **E** | **Express v5** | Lightweight async-first REST API framework handling 50+ endpoints across 6 resource modules with Zod validation |
| **R** | **React 19 + Vite** | Modern component-driven SPA with Tailwind v4 styling, Three.js 3D backgrounds, and real-time Socket.io integration |
| **N** | **Node.js + Socket.io** | Event-driven runtime powering simultaneous RESTful APIs and real-time bidirectional chat & notification engine |

---

## Backend Health Check

- **Endpoint:** `GET /health`
- **Response:** `{ "status": "OK", "timestamp": "2026-06-10T..." }`
- **Location:** `backend/src/app.js:30`
- **Status:** Already implemented
