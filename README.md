# Job Portal API

A job portal built with the MERN stack. Employers register, post jobs and manage the applications they receive. Candidates register, search for jobs, apply and track their applications.

The API is the main part of the project. A small React client is included in `frontend/` for browsing jobs and testing the main flows in a browser.

## Tech stack

- Node.js and Express
- MongoDB with Mongoose
- JWT authentication and bcrypt password hashing
- express-validator for request validation
- React with Vite and React Router

## Project structure

```
job-portal-api/
  config/db.js
  controllers/
  middleware/          auth, role check, validation, error handler
  models/
  routes/
  postman/             exported collection and environment
  frontend/            React client
  app.js
  server.js
  .env.example
  README.md
```

## Setup

### 1. Backend

```bash
npm install
cp .env.example .env
# fill in MONGODB_URI and JWT_SECRET
npm run dev
```

The API runs on `http://localhost:3000` by default.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The client runs on `http://localhost:5173` and calls the API at `http://localhost:3000`. To use another API URL, copy `frontend/.env.example` to `frontend/.env` and change `VITE_API_URL`.

## Environment variables

| Variable      | Description                                |
| ------------- | ------------------------------------------ |
| `PORT`        | Port the API listens on (default `3000`)   |
| `MONGODB_URI` | MongoDB connection string                  |
| `MONGODB_DB`  | Database name (default `job-portal`)       |
| `JWT_SECRET`  | Secret used to sign login tokens           |

`.env` is ignored by git. Commit `.env.example` only.

## Endpoints

| Method | Endpoint                       | Access      | What it does                              |
| ------ | ------------------------------ | ----------- | ----------------------------------------- |
| POST   | `/api/auth/register`           | Public      | Register a candidate or an employer       |
| POST   | `/api/auth/login`              | Public      | Log in and receive a JWT                  |
| GET    | `/api/auth/me`                 | Logged in   | Get the current user's profile            |
| POST   | `/api/jobs`                    | Employer    | Create a job                              |
| GET    | `/api/jobs`                    | Public      | List jobs with search, filters and paging |
| GET    | `/api/jobs/:id`                | Public      | Get one job                               |
| PUT    | `/api/jobs/:id`                | Job owner   | Update a job                              |
| PATCH  | `/api/jobs/:id/close`          | Job owner   | Close a job                               |
| DELETE | `/api/jobs/:id`                | Job owner   | Delete a job and its applications         |
| GET    | `/api/jobs/:id/stats`          | Job owner   | Application count per status              |
| POST   | `/api/jobs/:id/apply`          | Candidate   | Apply to a job                            |
| GET    | `/api/jobs/:id/applications`   | Job owner   | Applications for one job                  |
| GET    | `/api/applications/my`         | Candidate   | Get the current candidate's applications  |
| PATCH  | `/api/applications/:id/status` | Job owner   | Change an application status              |
| DELETE | `/api/applications/:id`        | Applicant   | Withdraw an application                   |

Send the token in the header:

```
Authorization: Bearer <token>
```

### Register body

```json
{
  "name": "Riya Gurung",
  "email": "riya@example.com",
  "password": "secret123",
  "role": "candidate"
}
```

For an employer, add `companyName`. It is required when `role` is `employer`.

### Create job body

```json
{
  "title": "Backend Developer",
  "description": "Build and maintain Node.js services.",
  "companyName": "Himalayan Tech",
  "location": "Kathmandu",
  "type": "full-time",
  "salary": 90000,
  "skills": ["Node.js", "Express", "MongoDB"]
}
```

`companyName` is optional on this route. If it is missing, the employer's company name is used. The allowed types are `full-time`, `part-time`, `internship` and `remote`.

### Getting all jobs

Supported query parameters:

| Parameter   | Example          | Notes                                              |
| ----------- | ---------------- | -------------------------------------------------- |
| `search`    | `react`          | Searches the title and company name                |
| `location`  | `kathmandu`      | Case-insensitive partial match                     |
| `type`      | `remote`         | One of the four job types                          |
| `skill`     | `javascript`     | Case-insensitive match inside the skills array     |
| `minSalary` | `50000`          | Minimum monthly salary                             |
| `sort`      | `-salary`        | `salary`, `-salary`, `title`, `-title`, `createdAt`, `-createdAt` |
| `page`      | `1`              | Positive integer                                   |
| `limit`     | `10`             | Between 1 and 100                                  |

The response shape for the list is:

```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "pages": 5,
  "count": 10,
  "data": []
}
```

## Database

There are three collections.

### User

`name`, `email` (unique), `password` (bcrypt hash, never returned), `role` (`candidate` or `employer`), `companyName` (required for employers), `createdAt`, `updatedAt`.

### Job

`title`, `description`, `companyName`, `location`, `type`, `salary`, `skills`, `status` (`open` or `closed`), `postedBy` (User reference), `createdAt`, `updatedAt`.

### Application

`job` (Job reference), `candidate` (User reference), `coverLetter`, `status` (`applied`, `shortlisted`, `rejected` or `hired`), `createdAt`, `updatedAt`.

A unique compound index on `{ job, candidate }` stops duplicate applications at the database level. The statistics endpoint uses an aggregation pipeline with `$match` and `$group`.

### Relationships

```
User (employer) 1 ──── * Job
Job             1 ──── * Application
User (candidate) 1 ──── * Application
```

## Application status transitions

```
applied ──> shortlisted ──> hired
   │              │
   │              └──────> rejected
   └──────────────────────> rejected
```

Only these moves are allowed:

| From          | To                       |
| ------------- | ------------------------ |
| `applied`     | `shortlisted`, `rejected` |
| `shortlisted` | `hired`, `rejected`       |
| `rejected`    | none                     |
| `hired`       | none                     |

A candidate can withdraw an application only while it is `applied`. Employers can only see and change jobs and applications that belong to them.

## Error responses

Errors use the same shape:

```json
{
  "success": false,
  "message": "You have already applied to this job"
}
```

| Status | Used for                                                        |
| ------ | --------------------------------------------------------------- |
| 201    | Resource created                                                |
| 200    | Fetched, updated, deleted or withdrawn successfully             |
| 400    | Validation error, invalid id, invalid status change             |
| 401    | Missing, invalid or expired token, wrong password               |
| 403    | Logged in but not allowed (wrong role or not the owner)          |
| 404    | Job, application or route not found                             |
| 409    | Duplicate email, duplicate application, applying to a closed job |
| 500    | Unexpected server error                                         |

## Postman

The `postman/` folder contains:

- `Job Portal API.postman_collection.json` with Auth, Jobs and Applications folders
- `Job Portal API.postman_environment.json` with `baseUrl`, token, `jobId` and `applicationId` variables

Import both files into Postman and select the **Job Portal API** environment. The collection uses `{{baseUrl}}` everywhere and Bearer tokens on protected routes. Login requests save the returned tokens automatically, Create Job saves `{{jobId}}`, and Apply to a Job saves `{{applicationId}}`.

The collection has 25 requests and 59 saved response examples. All examples are real responses from the API, including the failure cases.

### Test accounts

| Account              | Role      | Used for                         |
| -------------------- | --------- | -------------------------------- |
| `aarav@example.com`  | employer  | Himalayan Tech jobs              |
| `nisha@example.com`  | employer  | Everest Labs jobs, ownership tests |
| `riya@example.com`   | candidate | Applying and withdrawing         |
| `arjun@example.com`  | candidate | Duplicate and ownership tests    |

The password for all four accounts is `secret123`.

If you start with a fresh database, run the four Register requests once before the Login requests. If the sample accounts already exist, go straight to Login.

## Notes

- Passwords are hashed with bcrypt and excluded from every response.
- Ownership is checked in the controllers, not only in the routes.
- The unique index on applications is a second line of defence against double clicks and race conditions.
- The React client covers registration, login, job search, job details, applying, withdrawing, posting jobs and reviewing applications.
