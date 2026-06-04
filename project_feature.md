# 📌 Club-Based Event & Messaging Platform — System Design Notes

---

## 🧩 Core Modules

### 1. Messaging Service

* Direct Messages (DM)
* Club-based messaging

  * Event-specific groups
  * Team communication
* Group types:

  * Core Committee
  * Executive
  * Technical
  * Design
  * Publicity
  * Administrative & Sponsors
  * ➕ Option to create custom groups

---

### 2. Video Streaming Sessions

* Interviews
* Meetings
* Live Event Streaming

---

## 🔗 System Relationships (Flow)

* Donation & Sponsors → Club
* User (Member) → Club
* Event → Club
* Messaging Platform → Club
* Club → Live Online Sessions
* Live Streaming (external/extension)

---

## 💳 Payment Integration

* Razorpay integration
* Event-based payments

---

## 🏢 Club Structure

* Event is a part of a Club
* Users = Members of Clubs
* Members:

  * Have hierarchy
  * Have tags/roles

---

## 📅 Event Management

### Event Actions (by Club)

* Create
* Modify
* Postpone
* Cancel

### Event Features

* Separate event-specific group (select members/users)
* Two views:

  * Committee View
  * Non-Committee View
* Calendar-based visibility:

  * Upcoming
  * Live
  * Past (History)

### Participation

* Solo or Team-based
* Team features:

  * Creation
  * Leader assignment
  * Member invite/drop
  * Messaging
  * Video calls

---

## 🚫 Constraints

* Event committee members **cannot participate** in the event

---

## 👤 User Features

* Direct messaging (DM)
* Anonymous behavior (optional)
* Request to join clubs
* View events (calendar-based)

---

## 🛠️ Admin Controls

* Delete event groups
* Manage club structure
* Budget management:

  * Funding from donations & sponsors

---

## 🧾 Registration & Verification

* Optional document upload during registration
* SVNIT-specific verification:

  * Only allow login via SVNIT email
  * Admission number required
* Dedicated verifier role:

  * Verifies user
  * Adds entry to database

---

## 💡 Additional Notes

* Club is the central entity connecting:

  * Users
  * Events
  * Messaging
  * Streaming
  * Payments
* Highly modular system (can scale features independently)

---
