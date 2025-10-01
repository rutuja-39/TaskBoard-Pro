# 🚀 TaskBoard Pro

**TaskBoard Pro** is a full-stack, containerized, Kanban-style project management tool designed for Agile teams. Built with NextJS, Node.js, MongoDB, and JWT authentication, it allows seamless collaboration, real-time task tracking, and a delightful user experience.

---

## ✨ Key Features

- 📋 **Dynamic Kanban Board** – Organize tasks into "To Do", "In Progress", and "Done" lanes with responsive design.
- 🔐 **JWT Authentication** – Secure login system with token-based access control.
- 🧠 **Modular Architecture** – Clean separation between client, server, and services.
- 📦 **REST API** – Lightweight endpoints for tasks and user authentication.
- 🐳 **Docker + Kubernetes Ready** – Easily deployable via containers or orchestrated environments.
- 🎨 **User-Centric Design** – Built with usability in mind, designed via Balsamiq.

---

## 🧰 Tech Stack

| Layer         | Technology                      |
|---------------|----------------------------------|
| Frontend      | NextJS, HTML, CSS              |
| Backend       | Node.js, Express                |
| Database      | MongoDB                         |
| Authentication| JWT                             |
| Deployment    | Docker, Kubernetes              |
| Design Tools  | Balsamiq, Figma (optional)      |

---

## 📁 Project Structure
```
taskboard-pro/
├── client/           # NextJS Frontend
├── server/           # Node.js + Express Backend
├── docker/           # Dockerfiles & Compose
├── kubernetes/       # Kubernetes manifests
├── docs/             # Wireframes, Screenshots
├── .env              # Environment config
└── README.md         # This file
```

---

## 🛠️ Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/taskboard-pro.git
cd taskboard-pro
```

### 2. Environment Setup
Create a `.env` file in the `server/` directory:
```
MONGO_URI=mongodb://localhost:27017/taskboard
JWT_SECRET=your_jwt_secret
```

### 3. Run Backend
```bash
cd server
npm install
node app.js
```

### 4. Run Frontend
```bash
cd client
npm install
ng serve
```

Visit the app at: `http://localhost:4200`

---

## 🐳 Run with Docker

```bash
docker-compose up --build
```
Visit frontend on `http://localhost:4200` and backend on `http://localhost:3000`

---

## ☸️ Deploy with Kubernetes
Ensure Kubernetes and Docker are installed. Then apply manifests:
```bash
kubectl apply -f kubernetes/
```

---

## 🔒 API Endpoints

### Authentication
- `POST /auth/login` → Login user and return JWT token

### Tasks
- `GET /tasks` → Get all tasks
- `POST /tasks` → Create a new task

---

## 📸 Screenshots
(Sample wireframes or screenshots can be placed under `docs/screenshots/`)

---

## 📄 License
MIT License. Free to use and modify.

---

## 🙌 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 🤝 Acknowledgments
- Inspired by Agile boards like Trello & Jira
- Powered by open-source tools


