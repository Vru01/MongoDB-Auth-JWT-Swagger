# Let's Start

# 🔐 Secure Auth Backend (Node.js + MongoDB + Docker)

A production-ready REST API backend featuring JWT authentication, role-based folder structure, and automated API documentation via Swagger.

## 📂 Project Structure

```text
backend-app/
├── config/
│   └── db.js              # Database connection logic
├── controllers/
│   └── authController.js  # Business logic for Login/Signup/Profile
├── docs/
│   └── authDocs.js        # Swagger API Definitions (Clean separation)
├── middlewares/
│   └── authMiddleware.js  # JWT Verification & Protection
├── models/
│   └── User.js            # Mongoose Data Schema
├── routes/
│   └── authRoutes.js      # API Route definitions
├── .env                   # Environment Secrets (Not committed)
├── .gitignore             # Files to ignore in Git
├── docker-compose.yml     # MongoDB Container setup
├── index.js               # Entry point & Server config
└── package.json           # Dependencies

```

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v14 or higher)
* [Docker Desktop](https://www.docker.com/products/docker-desktop) (For the database)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd backend-app
npm install

```

### 2. Environment Setup

Create a `.env` file in the root directory and add the following config:

```ini
PORT=5000
# Database Connection String
MONGO_URI=mongodb://admin:password123@localhost:27017/auth_db?authSource=admin
# Secret Key for Signing JWTs (Make this unique!)
JWT_SECRET=supersecretkey123

```

### 3. Start the Database (Docker)

We use Docker Compose to spin up a persistent MongoDB instance.

```bash
docker-compose up -d

```

* *Note: This starts MongoDB on port `27017` with user `admin` and pass `password123`.*

### 4. Run the Server

Start the backend in development mode (auto-restarts on save):

```bash
npm run dev
# OR
npx nodemon index.js

```

---

## 📖 API Documentation (Swagger)

This project uses **Swagger UI** for interactive API testing and documentation.

1. Ensure the server is running (`npm run dev`).
2. Open your browser and navigate to:
> **[http://localhost:5000/api-docs](https://www.google.com/search?q=http://localhost:5000/api-docs)**



### How to Test Protected Routes in Swagger

1. Use the **POST /login** endpoint to get a token.
2. Copy the token string (without quotes).
3. Click the **Authorize** button at the top of the Swagger page.
4. Paste the token (e.g., `eyJhbGciOi...`).
5. Now you can execute protected routes like **GET /profile**.

---

## 🛠️ API Endpoints Summary

| Method | Endpoint | Description | Auth Required? |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Register a new user | ❌ No |
| `POST` | `/api/auth/login` | Login & receive JWT | ❌ No |
| `GET` | `/api/auth/profile` | Get current user details | ✅ Yes (JWT) |

---

## ⚠️ Important Notes for Developers

* **Database Persistence:** The `docker-compose.yml` uses a volume (`mongo-data`). Your data **will survive** even if you stop or restart the container. To wipe the DB completely, run `docker volume rm backend-app_mongo-data`.
* **JWT Security:** The `authMiddleware` expects the `Authorization` header to contain `Bearer <token>`.
* **Git Safety:** Never commit your `.env` file. It is already added to `.gitignore`.

---

### 🧪 Troubleshooting

**Error: `connect ECONNREFUSED 127.0.0.1:27017**`

* *Fix:* Your Docker container is not running. Run `docker-compose up -d`.

**Error: `Token is not valid**`

* *Fix:* Ensure you copied the full token string. If using Postman manually, ensure the header is `Authorization: Bearer <token>`.
