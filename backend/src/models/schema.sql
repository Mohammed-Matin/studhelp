-- 🐘 PostgreSQL Database Schema: Complete with Users, Clubs, Events, Teams, Messages, Payments

-- Ensure we are in the correct schema (student)
CREATE SCHEMA IF NOT EXISTS student;

-- ==========================================
-- 1. Custom ENUM Types for Users
-- ==========================================

CREATE TYPE student.user_role AS ENUM (
    'STUDENT',
    'ADMIN'
);

CREATE TYPE student.user_status AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);

CREATE TYPE student.degree_type AS ENUM (
    'BTECH',
    'MTECH',
    'PHD',
    'MSC'
);

CREATE TYPE student.gender_type AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);

-- ==========================================
-- 2. Users Table
-- ==========================================

CREATE TABLE student.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role student.user_role NOT NULL DEFAULT 'STUDENT',
    status student.user_status NOT NULL DEFAULT 'PENDING',
    full_name VARCHAR(150),
    admission_no VARCHAR(20) UNIQUE,
    branch VARCHAR(100),
    semester INTEGER,
    degree student.degree_type,
    gender student.gender_type,
    mobile_no VARCHAR(15) UNIQUE,
    bonafide_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON student.users(username);
CREATE INDEX idx_users_email ON student.users(email);


-- ==========================================
-- 3. Custom ENUM Types for Features
-- ==========================================

-- Club Member Roles
CREATE TYPE student.club_role AS ENUM (
    'CORE_COMMITTEE',
    'EXECUTIVE',
    'TECHNICAL',
    'DESIGN',
    'PUBLICITY',
    'ADMINISTRATIVE_SPONSORS',
    'CUSTOM'
);

-- Event Statuses
CREATE TYPE student.event_status AS ENUM (
    'UPCOMING',
    'LIVE',
    'PAST',
    'POSTPONED',
    'CANCELLED'
);

-- Team Member Statuses
CREATE TYPE student.team_member_status AS ENUM (
    'INVITED',
    'JOINED',
    'DECLINED',
    'DROPPED'
);

-- Payment Statuses
CREATE TYPE student.payment_status AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
);

-- ==========================================
-- 4. Feature Tables
-- ==========================================

-- Clubs Table
CREATE TABLE student.Clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    budget_balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Club_Members Mapping Table
CREATE TABLE student.Club_Members (
    user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
    role_tag student.club_role NOT NULL DEFAULT 'CUSTOM',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, club_id)
);

-- Events Table
CREATE TABLE student.Events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status student.event_status NOT NULL DEFAULT 'UPCOMING',
    entry_fee DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teams Table
CREATE TABLE student.Teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES student.Events(id) ON DELETE CASCADE,
    leader_id UUID NOT NULL REFERENCES student.users(id) ON DELETE RESTRICT,
    team_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, team_name) -- A team name must be unique per event
);

-- Team_Members Mapping Table
CREATE TABLE student.Team_Members (
    team_id UUID NOT NULL REFERENCES student.Teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
    status student.team_member_status NOT NULL DEFAULT 'INVITED',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id)
);

-- Messages Table (DMs, Group/Club/Event Chats)
CREATE TABLE student.Messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
    -- receiver_id can be a User ID (for DMs) or a Group ID (like Event ID, Club ID, Team ID)
    -- We use VARCHAR/UUID to store it dynamically depending on the group logic
    receiver_id UUID NOT NULL,
    is_group_chat BOOLEAN DEFAULT FALSE, -- Flag to differentiate DM vs Group Message
    group_type VARCHAR(50), -- e.g., 'CLUB', 'EVENT', 'TEAM' (optional helper)
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE student.Payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE RESTRICT,
    event_id UUID NOT NULL REFERENCES student.Events(id) ON DELETE RESTRICT,
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_signature VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status student.payment_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. Indexes (For optimization)
-- ==========================================

CREATE INDEX idx_club_members_club_id ON student.Club_Members(club_id);
CREATE INDEX idx_events_club_id ON student.Events(club_id);
CREATE INDEX idx_events_status ON student.Events(status);
CREATE INDEX idx_teams_event_id ON student.Teams(event_id);
CREATE INDEX idx_messages_receiver_id ON student.Messages(receiver_id);
CREATE INDEX idx_payments_user_id ON student.Payments(user_id);
CREATE INDEX idx_payments_event_id ON student.Payments(event_id);
