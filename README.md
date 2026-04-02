
# Finance Dashboard Backend API

A production-grade RESTful backend for managing financial records, users, and dashboard analytics — built with Node.js, Express, and MongoDB.

---

## Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Runtime        | Node.js ≥ 18                            |
| Framework      | Express.js 4                            |
| Database       | MongoDB + Mongoose 8                    |
| Auth           | JWT (jsonwebtoken) + bcryptjs           |
| Validation     | express-validator                       |
| Security       | helmet, cors, express-rate-limit        |
| Documentation  | Swagger UI (swagger-ui-express + YAML)  |
| Logging        | morgan                                  |

---

## Project Structure

```
finance-dashboard/
├── app.js                  # Express app setup, middleware, server start
├── config/
│   ├── db.js               # MongoDB connection
│   └── constants.js        # Roles, statuses, permissions matrix
├── controllers/
│   ├── authController.js   # Register, login, get-me
│   ├── userController.js   # CRUD for users (Admin)
│   ├── recordController.js # CRUD for financial records
│   └── dashboardController.js # Analytics aggregations
├── middleware/
│   ├── authenticate.js     # JWT verification, attaches req.user
│   ├── authorize.js        # Permission-based + role-based guards
│   ├── validators.js       # Input validation chains
│   └── errorHandler.js     # Global error handler + AppError class
├── models/
│   ├── User.js             # Mongoose user schema
│   └── FinancialRecord.js  # Mongoose financial record schema
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── recordRoutes.js
│   └── dashboardRoutes.js
├── utils/
│   ├── jwt.js              # generateToken / verifyToken
│   ├── response.js         # sendSuccess / sendError helpers
│   └── seeder.js           # Dev database seeder
├── docs/
│   └── swagger.yaml        # OpenAPI 3.0 spec
├── .env.example
└── package.json
```

---

## Setup Instructions

### 1. Prerequisites

- Node.js ≥ 18.x
- MongoDB (local instance or MongoDB Atlas)

### 2. Clone and install dependencies

```bash
git clone <repo-url>
cd finance-dashboard
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/finance_dashboard
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

### 4. Seed the database (optional but recommended)

```bash
npm run seed
```

This creates 3 test users and 120 realistic financial records.

**Test Credentials:**

| Role    | Email                  | Password      |
|---------|------------------------|---------------|
| Admin   | admin@example.com      | Admin1234     |
| Analyst | analyst@example.com    | Analyst1234   |
| Viewer  | viewer@example.com     | Viewer1234    |

### 5. Start the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:5000`

---

## API Documentation

Interactive Swagger docs available at:
```
http://localhost:5000/api/v1/docs
```

Health check:
```
GET http://localhost:5000/health
```

---

## API Endpoints

All API routes are prefixed with `/api/v1`.

### Auth

| Method | Endpoint         | Access  | Description              |
|--------|-----------------|---------|--------------------------|
| POST   | /auth/register  | Public  | Register a new user      |
| POST   | /auth/login     | Public  | Login and receive JWT    |
| GET    | /auth/me        | Private | Get current user profile |

### Users (Admin only)

| Method | Endpoint      | Description                    |
|--------|--------------|--------------------------------|
| GET    | /users        | List all users (paginated)     |
| GET    | /users/:id    | Get a single user              |
| PATCH  | /users/:id    | Update user role/status/name   |
| DELETE | /users/:id    | Soft-delete a user             |

**Query params for GET /users:**
- `page`, `limit` — pagination
- `role` — filter by role
- `status` — filter by status
- `search` — search by name or email

### Financial Records

| Method | Endpoint        | Access       | Description                |
|--------|----------------|--------------|----------------------------|
| GET    | /records        | All roles    | List records (paginated)   |
| GET    | /records/:id    | All roles    | Get a single record        |
| POST   | /records        | Admin only   | Create a record            |
| PUT    | /records/:id    | Admin only   | Update a record            |
| DELETE | /records/:id    | Admin only   | Soft-delete a record       |

**Query params for GET /records:**
- `page`, `limit` — pagination
- `type` — `income` or `expense`
- `category` — partial match, case-insensitive
- `startDate`, `endDate` — ISO 8601 date range
- `search` — search category or note
- `sortBy` — field to sort by (default: `date`)
- `sortOrder` — `asc` or `desc` (default: `desc`)

### Dashboard Analytics (Analyst + Admin)

| Method | Endpoint                   | Description                             |
|--------|---------------------------|-----------------------------------------|
| GET    | /dashboard/summary         | Total income, expenses, balance, recent 5 |
| GET    | /dashboard/categories      | Category-wise totals                    |
| GET    | /dashboard/trends          | Monthly income/expense trends           |
| GET    | /dashboard/range-summary   | Summary for a custom date range         |

**Query params:**
- `GET /dashboard/categories?type=income|expense`
- `GET /dashboard/trends?months=12`
- `GET /dashboard/range-summary?startDate=2024-01-01&endDate=2024-12-31`

---

## Role-Based Access Control

```
Viewer   → read
Analyst  → read, analytics
Admin    → read, analytics, write, delete, manage_users
```

Unauthorized requests return:
```json
{
  "success": false,
  "message": "Access forbidden. Your role (viewer) does not have permission to perform this action."
}
```

---

## Response Envelope

All API responses follow a consistent shape:

**Success:**
```json
{
  "success": true,
  "message": "Records fetched successfully.",
  "data": { ... },
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    { "field": "amount", "message": "Amount must be greater than 0" }
  ]
}
```

---

## HTTP Status Codes

| Code | Meaning                       |
|------|-------------------------------|
| 200  | OK                            |
| 201  | Created                       |
| 400  | Bad Request / Validation Error|
| 401  | Unauthorized (no/invalid JWT) |
| 403  | Forbidden (insufficient role) |
| 404  | Resource not found            |
| 429  | Too many requests             |
| 500  | Internal server error         |

---

## Security Features

- **Helmet** — sets secure HTTP headers
- **CORS** — configurable allowed origins
- **Rate limiting** — 100 req/15 min globally; 20 req/15 min on auth routes
- **Password hashing** — bcrypt with salt rounds = 12
- **JWT** — signed tokens with configurable expiry
- **Soft deletes** — records and users are never hard-deleted
- **Payload size limit** — JSON bodies capped at 10kb

---

## Design Decisions & Assumptions

1. **Soft deletes everywhere** — Financial data is sensitive; hard deletes are dangerous. Both users and records use `deletedAt` timestamps.
2. **Generic auth error messages** — Login returns "Invalid email or password" for both wrong email and wrong password to prevent user enumeration.
3. **Viewer ≠ analytics** — Viewers can browse individual records but cannot access aggregated analytics. This is intentional to support data-privacy use cases.
4. **Analyst cannot write** — Analysts are read + analytics only. All mutations require Admin.
5. **Pagination defaults** — Default page size is 20, capped at 100 per request.
6. **Monthly trends max 24 months** — Prevents accidentally expensive aggregations.
7. **Self-protection rules** — Admins cannot deactivate, delete, or downgrade their own account.
8. **Password policy** — Minimum 8 characters, must contain uppercase, lowercase, and a digit.
=======

