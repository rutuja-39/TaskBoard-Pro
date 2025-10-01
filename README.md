# TaskBoard Pro 🚀

A modern, real-time collaborative project management application featuring an innovative **Hybrid Mode** that combines traditional Kanban boards with an infinite canvas workspace.

![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-white?logo=socket.io)

## ✨ Features

### 📋 **Traditional Kanban Board**
- Drag-and-drop task management
- Three-column layout (To Do, In Progress, Done)
- Rich task details with comments
- Priority levels and due dates
- Team member assignment

### 🎨 **Infinite Canvas Mode**
- Unlimited workspace for visual organization
- Sticky notes, shapes, drawings, and text
- Spatial comments for contextual feedback
- Frames for grouping content
- Dynamic grid with zoom support
- Mini-map for navigation

### 🔄 **Hybrid Mode (Innovative!)**
- **Kanban boards as draggable canvas objects**
- Multiple boards on one canvas
- Dynamic column management (add/remove/collapse)
- Visual linking between objects
- Full task management within canvas boards
- Separate task stores for Kanban and Hybrid boards

### 👥 **Real-Time Collaboration**
- Live user cursors with name badges
- Real-time presence awareness
- Follow mode to track team members
- Instant synchronization via WebSocket
- Spatial comments with replies
- User activity indicators

### 🔐 **Authentication & Security**
- JWT-based authentication
- HTTP-only cookie sessions
- Role-based access control (Owner, Admin, Member, Viewer)
- Password hashing with bcrypt
- Project-level permissions

### 🎯 **Project Management**
- Multi-project workspace
- Team member invitations
- Project settings and member management
- Per-project task isolation
- Activity tracking

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** - App Router with React Server Components
- **React 19** - Latest features including Server Actions
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **React-Konva** - Canvas rendering engine
- **Lucide React** - Icon system

### **Backend**
- **Next.js API Routes** - Serverless functions
- **Socket.io** - Real-time WebSocket communication
- **MongoDB** - Document database with native driver
- **Jose** - JWT token management
- **Bcrypt** - Password hashing

### **Architecture**
- RESTful API design
- Optimistic UI updates
- Real-time presence system
- In-memory presence tracking
- Room-based WebSocket architecture

## 📦 Installation

### Prerequisites
- **Node.js** 18.17 or later
- **MongoDB** 4.4 or later (local or Atlas)
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd taskboard-pro
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/taskboard
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/taskboard?retryWrites=true&w=majority

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Optional: Node Environment
NODE_ENV=development
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start MongoDB
**Local MongoDB:**
```bash
mongod --dbpath /path/to/data/directory
```

**Or use MongoDB Atlas** (cloud): Update `MONGODB_URI` with your Atlas connection string

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Deployment

### **Method 1: Docker Compose (Recommended)**

#### 1. Create `Dockerfile`
Already included in the repository.

#### 2. Build and Run
```bash
# Build and start all services (app + MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at `http://localhost:3000`

#### 3. Environment Variables
Edit `docker-compose.yml` or create `.env` file:
```env
JWT_SECRET=your-generated-jwt-secret
MONGODB_URI=mongodb://mongo:27017/taskboard
```

### **Method 2: Docker Only**

#### 1. Build the Image
```bash
docker build -t taskboard-pro .
```

#### 2. Run MongoDB Container
```bash
docker run -d \
  --name taskboard-mongo \
  -p 27017:27017 \
  -v taskboard-data:/data/db \
  mongo:latest
```

#### 3. Run Application Container
```bash
docker run -d \
  --name taskboard-app \
  -p 3000:3000 \
  --link taskboard-mongo:mongo \
  -e MONGODB_URI=mongodb://mongo:27017/taskboard \
  -e JWT_SECRET=your-jwt-secret \
  taskboard-pro
```

### **Method 3: Production Deployment**

#### Using Docker Hub
```bash
# Build for production
docker build -t yourusername/taskboard-pro:latest .

# Push to Docker Hub
docker push yourusername/taskboard-pro:latest

# Pull and run on production server
docker pull yourusername/taskboard-pro:latest
docker-compose -f docker-compose.prod.yml up -d
```

#### Using Cloud Platforms
- **AWS ECS/Fargate**: Use provided `Dockerfile`
- **Google Cloud Run**: Deploy with `gcloud run deploy`
- **Azure Container Apps**: Use Azure CLI
- **Heroku**: Use Heroku Container Registry
- **DigitalOcean App Platform**: Connect GitHub and auto-deploy

### Docker Configuration Files

**`Dockerfile`:**
```dockerfile
FROM node:18-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/server.js ./server.js

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**`docker-compose.yml`:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/taskboard
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

## 📁 Project Structure

```
taskboard-pro/
├── app/                        # Next.js App Router
│   ├── api/                    # API Routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── projects/           # Project management
│   │   ├── tasks/              # Task CRUD operations
│   │   └── canvas/             # Canvas objects API
│   ├── dashboard/              # Main dashboard page
│   ├── projects/[id]/          # Individual project page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing/login page
│   └── globals.css             # Global styles
├── components/
│   ├── auth/                   # Authentication components
│   ├── canvas/                 # Infinite canvas components
│   │   ├── canvas-workspace.tsx
│   │   ├── canvas-toolbar.tsx
│   │   ├── hybrid-kanban-board.tsx
│   │   ├── sticky-note.tsx
│   │   ├── spatial-comment.tsx
│   │   ├── user-cursor.tsx
│   │   └── presence-panel.tsx
│   ├── kanban/                 # Traditional Kanban components
│   │   ├── kanban-board.tsx
│   │   ├── task-card.tsx
│   │   └── create-task-dialog.tsx
│   ├── projects/               # Project management components
│   ├── dashboard/              # Dashboard components
│   └── ui/                     # Reusable UI components (shadcn)
├── lib/
│   ├── auth.ts                 # Authentication utilities
│   ├── mongodb.ts              # Database connection
│   ├── types.ts                # TypeScript type definitions
│   ├── utils.ts                # Utility functions
│   └── useCollaboration.ts     # Real-time collaboration hook
├── server.js                   # Custom Socket.io server
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
├── Dockerfile                  # Docker image definition
├── docker-compose.yml          # Docker Compose configuration
└── README.md                   # This file
```

## 🎮 Usage Guide

### **Getting Started**
1. **Register/Login**: Create an account or log in
2. **Create Project**: Click "Create Project" and name it
3. **Choose View Mode**: Toggle between Kanban, Canvas, or Hybrid

### **Kanban Mode**
- Click **"New Task"** to create tasks
- **Drag and drop** tasks between columns
- Click any task to view details and add comments
- Use filters to sort by priority or assignee

### **Canvas Mode**
- **Tools** (keyboard shortcuts):
  - `V` - Select tool
  - `H` - Hand tool (pan)
  - `S` - Sticky note
  - `P` - Pen (draw)
  - `R` - Shapes (rectangle, circle, triangle, etc.)
  - `T` - Text
  - `B` - Kanban board
  - `L` - Link objects
  - `C` - Add comment
  - `G` - Toggle grid
  - `Del` - Delete selected
  - `Space + Drag` - Pan

### **Hybrid Kanban Boards**
1. Press `B` to create a board
2. Click **"+ Add Task"** in any column
3. Fill the task form
4. **Click tasks** to view/edit details
5. **Drag tasks** between columns
6. **Drag the board** to reposition on canvas
7. **Add/Remove columns** using the buttons
8. **Double-click title** to rename the board
9. **Collapse/Expand** using the arrow button

### **Collaboration**
- See **live cursors** of other users
- Click **"Follow"** to sync your view with another user
- Add **spatial comments** by pressing `C` and clicking
- **Double-click comments** to edit text
- Click **✓ button** to resolve comments

### **Team Management**
1. Open **Project Settings**
2. Go to **Team Members** tab
3. Enter email and select role (Admin/Member/Viewer)
4. Click **"Invite Member"**

## 🔌 API Documentation

### **Authentication**
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### **Projects**
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/members` - Invite member
- `DELETE /api/projects/[id]/members` - Remove member

### **Tasks**
- `GET /api/tasks?projectId=X` - List project tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/tasks/[id]/comments` - Add comment

### **Canvas Objects**
- `GET /api/canvas?projectId=X` - List canvas objects
- `POST /api/canvas` - Create canvas object
- `PUT /api/canvas/[id]` - Update canvas object
- `DELETE /api/canvas/[id]` - Delete canvas object

### **WebSocket Events**
- `join-project` - Join project room
- `cursor-move` - Broadcast cursor position
- `viewport-change` - Broadcast pan/zoom
- `object-select` - Broadcast selection
- `create-comment` - Broadcast new comment
- `update-comment` - Broadcast comment update
- `presence-update` - Receive user presence

## 🧪 Testing

### Manual Testing
1. Open two browser windows (or one incognito)
2. Log in as different users
3. Join the same project
4. Test real-time features:
   - Move cursor → see in other window
   - Create task → appears immediately
   - Move task → syncs in real-time
   - Add comment → appears for all users

### Check Console Logs
Open DevTools (F12) → Console to see:
```
[Collab] ✅ Connected to WebSocket
[Kanban] ✅ Task updated successfully in database
[Canvas] 👥 Setting 2 other users
```

## 🚀 Performance

- **Optimistic UI updates** for instant feedback
- **Cursor throttling** (50ms) to reduce network load
- **Room-based broadcasting** for scalability
- **Dynamic grid rendering** for smooth zooming
- **Lazy loading** of canvas objects
- **Connection pooling** for MongoDB

## 🔒 Security

- JWT tokens with HTTP-only cookies
- Password hashing with bcrypt (10 rounds)
- Project-level access control
- Input validation and sanitization
- CORS configuration for production
- Environment variable protection

## 🛠️ Development

### Scripts
```bash
npm run dev          # Start development server with Socket.io
npm run dev:next     # Start without Socket.io (standard Next.js)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Adding New Features
1. Create components in `/components`
2. Add API routes in `/app/api`
3. Define types in `/lib/types.ts`
4. Update WebSocket events in `server.js` and `useCollaboration.ts`

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🐛 Known Issues & Limitations

- Real-time sync requires WebSocket connection
- Presence data is in-memory (lost on server restart)
- No operational transform (last-write-wins for conflicts)
- File attachments not yet implemented

## 🗺️ Roadmap

- [ ] Offline mode with sync
- [ ] File attachments for tasks
- [ ] Advanced filtering and search
- [ ] Export/import projects
- [ ] Activity feed and notifications
- [ ] Mobile responsive improvements
- [ ] Voice/video chat integration
- [ ] Advanced analytics dashboard

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Contact: your-email@example.com

---

**Built with ❤️ using Next.js, React, and Socket.io**

⭐ Star this repo if you find it helpful!

