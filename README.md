# Smart Student Portal — MERN Stack (JavaScript)

MongoDB + Express + React + Node. 100% JavaScript (no TypeScript).
Two apps: `server` (REST API, JWT auth, PDF uploads) and `client` (React 18 + Vite + Tailwind).

```
smart-student-portal/
├─ server/           Express + Mongoose API
│  ├─ src/index.js   app bootstrap
│  ├─ src/auth.js    JWT sign/verify, requireAuth / requireAdmin
│  ├─ src/models.js  Mongoose models
│  ├─ src/seed.js    demo data seeding (hashed passwords)
│  └─ src/routes/    auth.js · state.js · admin.js
└─ client/           React app (JSX)
   └─ src/lib/api.js fetch wrapper that attaches the JWT
```

## Prerequisites
- Node.js 20+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI
- VS Code (recommended extensions: ESLint, Tailwind CSS IntelliSense, MongoDB for VS Code)

## Run it in VS Code

1. Unzip the project and open the `smart-student-portal` folder in VS Code
   (`File → Open Folder…`).
2. Open a terminal (`Ctrl + ~`) and start the **backend**:
   ```sh
   cd server
   npm install
   cp .env.example .env       # Windows: copy .env.example .env
   npm run dev                # http://localhost:5000
   ```
   On first boot the database is seeded with demo branches, students, subjects,
   marks, notices, syllabus and timetables.
3. Open a **second terminal** (`+` icon) and start the **frontend**:
   ```sh
   cd client
   npm install
   cp .env.example .env       # VITE_API_URL=/api  (proxied to :5000)
   npm run dev                # http://localhost:8080
   ```
4. Open http://localhost:8080 and sign in.

### Demo logins
| Role | Username | Password |
|---|---|---|
| Admin | `admin@college.edu` | `admin@123` |
| Student | `22csea001@college.edu` | `student@123` |

## Authentication
- `POST /api/auth/login` verifies the password with **bcrypt** and returns a **JWT**
  (`{ role, studentId }`, 7-day expiry, signed with `JWT_SECRET`).
- The client stores the token and sends `Authorization: Bearer <token>` on every call.
- `requireAuth` protects every data route; `requireAdmin` additionally restricts the
  management endpoints. A student token on an admin route gets `403 Admins only`.

## API

### Public / authenticated
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/health` | public | Health check |
| POST | `/api/auth/login` | public | Login, returns JWT |
| GET | `/api/auth/me` | auth | Current session profile |
| GET | `/api/state` | auth | Full portal snapshot |
| PUT | `/api/state` | auth | Persist changes (students: own profile only) |

### Admin only (`/api/admin/*`, requires an admin JWT)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/students` | List / create students |
| PUT/DELETE | `/students/:id` | Update / delete a student (also removes their marks) |
| GET/POST | `/marks` | List (filter `?studentId=&semester=`) / create |
| PUT | `/marks` | Bulk upsert `{ marks: [...] }` |
| PUT/DELETE | `/marks/:id` | Update / delete a mark record |
| GET/POST | `/subjects`, DELETE `/subjects/:code` | Subject catalogue |
| GET/POST | `/timetables` | List / upload a timetable (multipart PDF) |
| PUT/DELETE | `/timetables/:id` | Update / delete a timetable |
| POST | `/uploads` | Upload a PDF (`kind` = syllabus / library / notice) |
| GET | `/uploads?kind=` | List uploaded PDFs |
| DELETE | `/uploads/:id` | Delete the record and the file on disk |

PDFs are stored in `server/uploads/` and served at `http://localhost:5000/uploads/<file>`.
Only `application/pdf` up to 15 MB is accepted.

### Example
```sh
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@college.edu","password":"admin@123"}' | jq -r .token)

curl -X POST http://localhost:5000/api/admin/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F kind=syllabus -F title="CSE Sem 5 Syllabus" -F file=@syllabus.pdf
```

## Production build
```sh
cd client && npm run build     # outputs client/dist — serve with any static host
cd server && npm start
```

## Push to GitHub
```sh
cd smart-student-portal
git init
git add .
git commit -m "Smart Student Portal (MERN, JavaScript)"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```
Create the empty repo on github.com first (no README/.gitignore), then run the commands above.
`.env`, `node_modules` and `server/uploads` are already git-ignored.
