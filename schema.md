# 🐘 PostgreSQL Database Schema

---

## 1. Database & Schema

- **Database:** `studhelp`
- **Schema:** `student`

---

## 2. Custom ENUM Types

These ENUM types enforce strict data constraints at the database level.

| ENUM Type             | Allowed Values                          |
| --------------------- | --------------------------------------- |
| `student.user_role`   | `'STUDENT'`, `'ADMIN'`                  |
| `student.user_status` | `'PENDING'`, `'VERIFIED'`, `'REJECTED'` |
| `student.degree_type` | `'BTECH'`, `'MTECH'`, `'PHD'`, `'MSC'`  |
| `student.gender_type` | `'MALE'`, `'FEMALE'`, `'OTHER'`         |

---

## 3. Tables

### `student.users`

This table stores information about all users, including students and administrators.

| Column         | Type                       | Constraints                               | Description                                                                 |
| -------------- | -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `id`           | `UUID`                     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`| Unique identifier for the user (auto-generated).                            |
| `username`     | `VARCHAR(50)`              | `UNIQUE`, `NOT NULL`                      | Unique username for login.                                                  |
| `email`        | `VARCHAR(255)`             | `UNIQUE`, `NOT NULL`                      | Unique email address, used for login and communication.                     |
| `password_hash`| `TEXT`                     | `NOT NULL`                                | Hashed password for secure authentication.                                  |
| `role`         | `student.user_role`        | `NOT NULL`, `DEFAULT 'STUDENT'`           | User's role within the system (e.g., 'STUDENT', 'ADMIN').                   |
| `status`       | `student.user_status`      | `NOT NULL`, `DEFAULT 'PENDING'`           | Verification status of the user's account.                                  |
| `full_name`    | `VARCHAR(150)`             | `NULLABLE`                                | The user's full name.                                                       |
| `admission_no` | `VARCHAR(20)`              | `UNIQUE`, `NULLABLE`                      | Unique student admission number (for SVNIT verification).                   |
| `branch`       | `VARCHAR(100)`             | `NULLABLE`                                | Academic branch of the student.                                             |
| `semester`     | `INTEGER`                  | `NULLABLE`                                | Current semester of the student.                                            |
| `degree`       | `student.degree_type`      | `NULLABLE`                                | The degree program the student is enrolled in.                              |
| `gender`       | `student.gender_type`      | `NULLABLE`                                | The gender of the user.                                                     |
| `mobile_no`    | `VARCHAR(15)`              | `UNIQUE`, `NULLABLE`                      | The user's mobile phone number.                                             |
| `bonafide_url` | `TEXT`                     | `NULLABLE`                                | URL to the uploaded bonafide certificate for verification.                  |
| `created_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP`               | Timestamp when the user account was created.                                |
| `updated_at`   | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP`               | Timestamp when the user account was last updated.                           |

---

## 4. Indexes

Indexes are created to optimize query performance for frequently accessed columns.

### `student.users`

| Index Name           | Column(s)  | Description                               |
| -------------------- | ---------- | ----------------------------------------- |
| `idx_users_username` | `username` | Speeds up lookups by username (e.g., login). |
| `idx_users_email`    | `email`    | Speeds up lookups by email (e.g., login).    |

