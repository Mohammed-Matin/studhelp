# StudHelp — College Club & Event Management Platform

## Overview

Full-stack SaaS platform for managing college clubs, events, teams, payments, and real-time communication. Built for NIT Surat (SVNIT). Students register with bonafide documents, admins verify them, and verified users can join clubs, participate in events, form teams, make payments, and chat in real-time.

---

## Tech Stack

| Layer      | Technology                                                                 |
|------------|----------------------------------------------------------------------------|
| Frontend   | React 19 + Vite 8 + Tailwind CSS 4 + React Router 7 + Socket.io-client    |
| Backend    | Node.js + Express 5 + Socket.io + JWT (jsonwebtoken) + Zod                 |
| Database   | PostgreSQL (via `pg` Pool) on NeonDB                                       |
| Storage    | Cloudinary (avatars, bonafide docs, gallery images)                        |
| Payments   | Razorpay                                                                   |
| Validation | Zod (shared patterns on both ends)                                         |

---

## Project Structure

```
studhelp/
├── backend/                        # Express API server
│   ├── server.js                   # HTTP + Socket.io bootstrap
│   ├── package.json
│   ├── .env                        # All secrets (DB, JWT, Cloudinary, Razorpay)
│   └── src/
│       ├── app.js                  # Express app: CORS, routes, 404, error handler
│       ├── config/
│       │   ├── config.config.js    # Env validation + export
│       │   ├── db.js               # pg Pool
│       │   └── cloudinary.js       # Cloudinary SDK config
│       ├── controllers/
│       │   ├── auth.controller.js      # 9 handlers
│       │   ├── clubs.controller.js     # 24 handlers
│       │   ├── events.controller.js    # 15 handlers
│       │   ├── teams.controller.js     # 7 handlers
│       │   ├── messages.controller.js  # 8 handlers
│       │   └── payments.controller.js  # 4 handlers
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── clubs.routes.js
│       │   ├── events.routes.js
│       │   ├── teams.routes.js
│       │   ├── messages.routes.js
│       │   └── payments.routes.js
│       ├── middlewares/
│       │   ├── auth.middleware.js  # authenticateUser, authorizeAdmin
│       │   └── upload.js           # Multer + CloudinaryStorage (bonafide, gallery, avatar)
│       ├── models/
│       │   └── schema.sql          # Full PostgreSQL DDL (16 tables, 8 enums)
│       ├── scripts/
│       │   ├── migrate.js          # Create schema
│       │   ├── seed.js             # Seed admin user
│       │   └── seed-demo.js        # Seed full demo data
│       └── validators/
│           └── auth.validators.js  # Zod: registerSchema, loginSchema
│
├── frontend/                       # React SPA
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env                        # VITE_API_BASE_URL
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css               # Tailwind v4
│       ├── api/
│       │   └── axiosInstance.js    # Axios + interceptors (token, auto-rotate)
│       ├── config/
│       │   └── config.js           # apiBaseUrl
│       ├── utils/
│       │   └── auth.js             # localStorage helpers
│       ├── validators/
│       │   └── authValidators.js   # Zod schemas (mirrors backend)
│       ├── routes/
│       │   └── AppRouter.jsx       # BrowserRouter + all routes
│       ├── components/
│       │   ├── Button.jsx
│       │   ├── FilePicker.jsx
│       │   ├── FormError.jsx
│       │   ├── InputField.jsx
│       │   └── ProtectedRoute.jsx  # Auth / Admin / Verified guards
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Dashboard.jsx
│           ├── AdminDashboard.jsx
│           ├── ClubPage.jsx
│           ├── EventPage.jsx
│           ├── CalendarView.jsx
│           ├── ChatInterface.jsx
│           ├── ProfilePage.jsx
│           ├── PaymentPage.jsx
│           └── VideoStreaming.jsx   # UI-only placeholder
│
├── prompts/                        # AI prompt templates (intra-team tooling)
│   └── backend-init.prompt.md
├── auth-plan.md
├── auth.txt
├── project_feature.md
├── schema.md
└── STUDHELP_PROJECT_REPORT.md      # ← This file
```

---

## Setup & Run

### Prerequisites

- Node.js ≥ 22
- npm
- A PostgreSQL database (NeonDB recommended)
- Cloudinary account
- Razorpay account (test mode)

### Backend

```bash
cd backend
cp .env.example .env   # No .env.example exists — create one from the config
npm install
npm run migrate        # Creates schema (enums + tables + indexes)
npm run seed           # Creates admin user (admin / admin123)
npm run seed-demo      # (Optional) Seeds full demo data
npm run dev            # nodemon on port 3000
```

Required env vars (`backend/.env`):

```
PORT=3000
JWT_SECRET=<random 64-char hex>
DATABASE_URL=postgresql://user:pass@host/studhelp?sslmode=require
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # Vite on port 5173
```

Env: `VITE_API_BASE_URL=http://localhost:3000/api/v1`

---

## What's Built (All Features)

### 1. Authentication & Users

| Endpoint                          | Method | Auth    | Description                              |
|-----------------------------------|--------|---------|------------------------------------------|
| `POST /api/v1/user/register`      | POST   | Public  | Register with bonafide upload            |
| `POST /api/v1/user/login`         | POST   | Public  | Login, returns JWT + user                |
| `POST /api/v1/user/logout`        | POST   | Public  | Client-side token clear                  |
| `POST /api/v1/user/rotate-token`  | POST   | Public  | Rotate JWT (used by axios interceptor)   |
| `GET /api/v1/user/profile`        | GET    | User    | Get own profile                          |
| `PATCH /api/v1/user/profile`      | PATCH  | User    | Update name/branch/semester/degree/gender/mobile |
| `POST /api/v1/user/avatar`        | POST   | User    | Upload avatar (multipart → Cloudinary)   |
| `PATCH /api/v1/user/verify/:userId` | PATCH | Admin | Verify/reject student                    |
| `GET /api/v1/user/pending`        | GET    | Admin   | List pending students                    |

- Frontend pages: `Login.jsx`, `Register.jsx`, `ProfilePage.jsx`
- Admin: `AdminDashboard.jsx` (verify/reject cards with bonafide download)
- Token auto-rotation on 401 via axios interceptor

### 2. Clubs

| Endpoint                                      | Auth | Description                           |
|-----------------------------------------------|------|---------------------------------------|
| `POST /api/v1/clubs`                          | User | Create club                           |
| `GET /api/v1/clubs`                           | —    | List all clubs                        |
| `GET /api/v1/clubs/mine`                      | User | Get user's clubs (membership)         |
| `GET /api/v1/clubs/following`                 | User | Get followed clubs                    |
| `GET /api/v1/clubs/:id`                       | User | Get club details (with role/status)   |
| `PATCH /api/v1/clubs/:id`                     | User | Update club                           |
| `GET /api/v1/clubs/:id/members`               | User | List members (ordered by role)        |
| `POST /api/v1/clubs/:id/members`              | User | Add member (core comm. only)          |
| `PATCH /api/v1/clubs/:id/members/:userId`     | User | Update member role                    |
| `DELETE /api/v1/clubs/:id/members/:userId`    | User | Remove member                         |
| `POST /api/v1/clubs/:id/follow`               | User | Follow club                           |
| `DELETE /api/v1/clubs/:id/follow`             | User | Unfollow club                         |
| `GET /api/v1/clubs/:id/followers`             | User | List followers                        |
| `POST /api/v1/clubs/:id/requests`             | User | Submit join request                   |
| `GET /api/v1/clubs/:id/requests`              | User | Get pending requests                  |
| `PATCH /api/v1/clubs/:id/requests/:reqId`     | User | Approve/reject join request           |
| `GET /api/v1/clubs/:id/gallery`               | User | List gallery images                   |
| `POST /api/v1/clubs/:id/gallery`              | User | Upload gallery image (multipart)      |
| `DELETE /api/v1/clubs/:id/gallery/:imageId`   | User | Delete gallery image                  |
| `POST /api/v1/clubs/:id/messages`             | User | Send follower message                 |
| `GET /api/v1/clubs/:id/messages`              | User | Get follower messages                 |
| `PATCH /api/v1/clubs/:id/messages/:msgId`     | User | Reply to follower message             |
| `GET /api/v1/clubs/:id/dashboard`             | User | Club dashboard (stats, budget)        |
| `GET /api/v1/clubs/:id/budget`                | User | Budget overview                       |
| `GET /api/v1/clubs/:id/budget/transactions`   | User | Budget transactions (paginated)       |
| `POST /api/v1/clubs/:id/budget/transactions`  | User | Add budget transaction                |
| `POST /api/v1/clubs/:id/donations`            | User | Record donation                       |

- Frontend page: `ClubPage.jsx` (~617 lines) — tabs for Gallery, Members, Events, About
- Member roles: CORE_COMMITTEE, EXECUTIVE, TECHNICAL, DESIGN, PUBLICITY, ADMINISTRATIVE_SPONSORS, CUSTOM
- Budget with INCOME/EXPENSE transactions, balance tracking

### 3. Events

| Endpoint                                      | Auth | Description                           |
|-----------------------------------------------|------|---------------------------------------|
| `POST /api/v1/events`                         | User | Create event (club managers only)     |
| `GET /api/v1/events`                          | —    | List events (filterable)              |
| `GET /api/v1/events/calendar`                 | User | Calendar grouped (upcoming/live/past) |
| `GET /api/v1/events/clashes`                  | User | Check time clashes                    |
| `GET /api/v1/events/:id`                      | User | Event details (organizers, teams, regs) |
| `PATCH /api/v1/events/:id`                    | User | Update event                          |
| `DELETE /api/v1/events/:id`                   | User | Delete event                          |
| `PATCH /api/v1/events/:id/postpone`           | User | Postpone (new start/end times)        |
| `PATCH /api/v1/events/:id/cancel`             | User | Cancel event                          |
| `GET /api/v1/events/:id/organizers`           | User | List organizers                       |
| `POST /api/v1/events/:id/organizers`          | User | Add organizer (club managers only)    |
| `DELETE /api/v1/events/:id/organizers/:uid`   | User | Remove organizer                      |
| `POST /api/v1/events/:id/register`            | User | Register for event                    |
| `DELETE /api/v1/events/:id/register`          | User | Unregister                            |
| `GET /api/v1/events/:id/registrations`        | User | List registrations                    |

- Frontend pages: `EventPage.jsx`, `CalendarView.jsx`
- Participation types: SOLO, TEAM, BOTH
- Status flow: UPCOMING → LIVE → PAST (or POSTPONED / CANCELLED)
- Entry fees with Razorpay integration

### 4. Teams

| Endpoint                                      | Auth | Description                           |
|-----------------------------------------------|------|---------------------------------------|
| `POST /api/v1/teams`                          | User | Create team (leader = authenticated)  |
| `GET /api/v1/teams`                           | —    | List all teams                        |
| `GET /api/v1/teams/:id`                       | User | Team details + members                |
| `DELETE /api/v1/teams/:id`                    | User | Delete team                           |
| `POST /api/v1/teams/invite`                   | User | Invite member (leader/manager only)   |
| `PATCH /api/v1/teams/:id/members/:userId`     | User | Update member status                  |
| `DELETE /api/v1/teams/:id/members/:userId`    | User | Remove member                         |

- Embedded in `EventPage.jsx` (team creation for TEAM/BOTH events)

### 5. Messaging (Real-time via Socket.io)

| Endpoint                                      | Auth | Description                           |
|-----------------------------------------------|------|---------------------------------------|
| `GET /api/v1/messages/search?q=`              | User | Search users                          |
| `GET /api/v1/messages/conversations`          | User | DM conversation list                  |
| `GET /api/v1/messages/dm/:userId`             | User | DM thread                             |
| `POST /api/v1/messages/dm`                    | User | Send DM + Socket.io emit              |
| `GET /api/v1/messages/group/:type/:groupId`   | User | Get group messages (CLUB/EVENT/TEAM)  |
| `POST /api/v1/messages/group/:type/:groupId`  | User | Send group msg + Socket.io emit       |
| `GET /api/v1/messages/club/:clubId/groups`    | User | Get club role groups                  |

- Frontend page: `ChatInterface.jsx` (~334 lines)
- Socket.io rooms: `dm_{userId}`, `CLUB_{clubId}`, `CLUB_{clubId}_{role_tag}`, `EVENT_{eventId}`, `TEAM_{teamId}`
- Anonymous message toggle

### 6. Payments (Razorpay)

| Endpoint                                      | Auth | Description                           |
|-----------------------------------------------|------|---------------------------------------|
| `GET /api/v1/payments/key`                    | —    | Get Razorpay public key               |
| `POST /api/v1/payments`                       | User | Create payment order                  |
| `GET /api/v1/payments/:id`                    | User | Check status (by UUID or order ID)   |
| `POST /api/v1/payments/verify`                | User | Verify HMAC signature                 |

- Frontend page: `PaymentPage.jsx` (~160 lines)
- Razorpay checkout integration with callback verification

### 7. Video Streaming

- `VideoStreaming.jsx` — UI-only placeholder with room name, dummy participants, mic/cam toggle, end call button
- No WebRTC implementation

### 8. Database Schema (`student` schema)

16 tables, 8 custom enums:

- `users` — Students & admins with verification workflow
- `Clubs` — Core club entity with member/follower counts + budget
- `Club_Members` — Many-to-many with role_tag
- `Club_Followers` — Many-to-many
- `Club_Gallery_Images` — Cloudinary URLs per club
- `Club_Join_Requests` — PENDING/APPROVED/REJECTED with message
- `Follower_Messages` — Follower → club inquiries with admin replies
- `Budget_Transactions` — INCOME/EXPENSE per club
- `Club_Donations` — Donor tracking
- `Events` — Club events with status, participation type, fees
- `Event_Organizers` — Many-to-many
- `Event_Registrations` — User registrations (unique per event)
- `Teams` — Per event, with unique team_name
- `Team_Members` — INVITED/JOINED/DECLINED/DROPPED
- `Messages` — DM and group messages with anonymous flag
- `Payments` — Razorpay integration records

---

## What's Left / Known Gaps

### High Priority

| Item | Details |
|------|---------|
| **Tests** | Zero tests exist anywhere — backend controllers, frontend components, integration |
| **Video streaming** | `VideoStreaming.jsx` is a UI shell — needs real WebRTC (PeerJS or similar) |
| **Push notifications** | No email or push notification system for event reminders, club updates, etc. |
| **Rate limiting** | No rate limiting on auth endpoints (register/login) — vulnerable to brute force |
| **Input sanitization** | Some fields (description, messages) accept raw HTML — no XSS protection |

### Medium Priority

| Item | Details |
|------|---------|
| **Deployment config** | No Docker, no CI/CD, no deployment scripts |
| **.env.example** | No example env file — teammates must reverse-engineer from `config.config.js` |
| **File upload validation** | File size/type limits enforced by Cloudinary but not validated before upload |
| **Password reset** | No forgot password / reset flow |
| **Email verification** | No email verification on registration (admin manually verifies bonafide) |
| **Pagination** | Only budget transactions have pagination — events, clubs, members, messages are unbounded |
| **Webhook for payments** | Razorpay payment timeout/status sync relies on frontend callback — no webhook endpoint |
| **Club join request limit** | No rate limit on join requests (spam possible) |
| **Search/filter** | Club and event lists have no search or advanced filter UI on frontend |

### Low Priority / Nice-to-have

| Item | Details |
|------|---------|
| **Admin user management** | No admin panel for managing users (ban, role change, etc.) beyond verification |
| **Event reminders** | No automatic status transitions (UPCOMING → LIVE → PAST) |
| **Dashboard analytics** | Club dashboard is basic — no charts or export |
| **Mobile responsiveness** | Not tested on mobile; Tailwind v4 used but no deliberate responsive design |
| **Cypress/Playwright** | No E2E tests |
| **CI lint step** | ESLint config exists on frontend but no CI to run it |

### Security Notes (Already Addressed)

- All UUID params validated with `UUID_REGEX` before hitting PostgreSQL (prevents crash)
- `createTeam` uses `req.user.userId` (not client-provided `leader_id`)
- `addOrganizer` checks club manager role
- `inviteMember` checks team leader or club manager
- `updateProfile` does not accept `avatar_url` from body
- `getPaymentStatus` conditionally queries by UUID or Razorpay order ID
- Global 404 + error handlers in Express
- Socket.IO errors caught in try/catch
- JWT token auto-rotation on 401

---

## Running Scripts

```bash
# Backend
npm run migrate     # Creates/updates database schema
npm run seed        # Seeds admin (admin / admin123)
npm run seed-demo   # Seeds demo data (users, clubs, events, teams, messages)
npm run dev         # nodemon (auto-restart on changes)
npm run start       # Production start with plain node

# Frontend
npm run dev         # Vite dev server on :5173
npm run build       # Production build
npm run lint        # ESLint check
npm run preview     # Preview production build
```

---

## Database

- Hosted on NeonDB (PostgreSQL)
- Schema: `student`
- Connection: `DATABASE_URL` in `backend/.env`
- Run `npm run migrate` to create tables
- All schema DDL in `backend/src/models/schema.sql`

---

## Key Design Decisions

- **ES Modules** throughout (`"type": "module"` in both `package.json` files)
- **No ORM** — raw SQL via `pg` Pool with parameterized queries
- **Token rotation** — 401 response triggers auto-rotation in axios interceptor
- **Socket.io attached to Express** — accessible via `req.app.get('io')` in controllers
- **Cloudinary for all media** — bonafide docs, avatars, gallery images, event banners
- **Tailwind v4** — latest version with Vite plugin (no PostCSS config needed)
- **Express v5** — async error handling works natively (no `express-async-errors`)
- **Zod on both sides** — validation schemas near-duplicated in `backend/src/validators/` and `frontend/src/validators/`
