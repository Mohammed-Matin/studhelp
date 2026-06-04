# 🚀 Backend Initialization Prompt (Reusable Template)

## Goal
Initiate a modular backend server using Express.js.

## Requirements

- Use **latest supporting version libraries**
- Backend must run on PORT from environment variables
- Follow modular architecture

## Setup Instructions

1. Create a `backend` folder at root
2. Initialize npm project
3. Install dependencies:
   - express
   - dotenv
   - nodemon (dev)

4. Enable ES Modules:
   - Add `"type": "module"` in package.json

---

## Project Structure

backend/
├── src/
│   ├── config/
│   │   └── config.config.js
│   ├── app.js
├── server.js
├── .env
├── package.json
├── .gitignore

---

## Config Requirements

- Validate all environment variables before server starts
- Exit process if any required variable is missing

---

## Environment Variables

PORT=3000

---

## gitignore

- node_modules/
- .env

--- 

## Server Requirements

- `app.js` → configure express app, initiate health check and root route
- `server.js` → start server using config
- Use config file for PORT
- Console log localhost with PORT on server start

---

## Scripts

- dev → nodemon server.js
- start → node server.js

---

## Notes

- Keep code clean and minimal
- Do NOT over-engineer
- Follow modular separation (app vs server)