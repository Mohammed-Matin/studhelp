# Auth Feature — Implementation Plan

## End-to-End Flow

```
Student Register (form + bonafide)
  → POST /api/v1/user/register
  → Cloudinary upload (bonafide)
  → bcrypt hash password
  → INSERT student.users (status: PENDING)
  → Response: { userId, status: "PENDING" }

Student/Admin Login (identifier + password)
  → POST /api/v1/user/login
  → Accept username OR email
  → bcrypt compare
  → Sign JWT (userId, role, status)
  → Response: { token, role, status, user }

Admin Verify Student
  → PATCH /api/v1/user/verify/:userId  (auth required + admin role)
  → UPDATE student.users SET status = 'VERIFIED'
  → Response: { message, userId, status }

Token Rotation
  → POST /api/v1/user/rotate-token
  → Verify old token → sign new one
  → Response: { token }

Logout
  → POST /api/v1/user/logout
  → Client-side: clear stored token
```

## Backend Structure

### New Files
| File | Purpose |
|---|---|
| `validators/auth.validators.js` | Zod schemas for register, login, verify |
| `config/cloudinary.js` | Cloudinary SDK config |
| `middlewares/upload.js` | Multer + Cloudinary storage engine |
| `controllers/auth.controller.js` | All auth handler functions |
| `routes/auth.routes.js` | Auth route definitions |

### Modified Files
| File | Change |
|---|---|
| `models/schema.sql` | Add CREATE TABLE student.users |
| `config/db.js` | Use DATABASE_URL instead of individual params |
| `config/config.config.js` | Validate JWT_SECRET, CLOUDINARY_CLOUD_NAME, etc. |
| `middlewares/auth.middleware.js` | Real JWT verify + role check |
| `app.js` | Mount /api/v1/user routes |
| `package.json` | Add bcrypt, jsonwebtoken, multer, zod, cloudinary |

## Frontend Changes

| File | Change |
|---|---|
| `pages/AdminDashboard.jsx` | New — list pending students, verify/reject buttons |
| `pages/Dashboard.jsx` | Show verification status banner |
| `routes/AppRouter.jsx` | Add admin routes, route guards |
| `api/axiosInstance.js` | Store token, attach to requests |

## Cloudinary Upload
- Use `multer-storage-cloudinary` for direct upload from middleware
- Store returned `secure_url` as `bonafide_url` in DB
- Placeholder: config uses env vars, ready for real API keys
