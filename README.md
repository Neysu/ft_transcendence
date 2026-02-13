*This project has been created as part of the 42 curriculum by egibeaux, lsellier, plerick, abidaux, luguo.*

# This project shall not be opened again

---

## Team Information

### 👤 egibeaux  
**Role:** Product Owner (PO)  
**Responsibilities:**  
- Defined the overall product vision and feature priorities  
- Ensured alignment between technical implementation and project objectives  
- Set up and configured Docker environment for containerized deployment  

---

### 👤 lsellier  
**Role:** Tech Lead  
**Responsibilities:**  
- Designed the backend architecture  
- Defined technical structure and best practices  
- Managed and structured the database schema  
- Ensured backend scalability and maintainability  

---

### 👤 plerick  
**Role:** Project Manager (PM)  
**Responsibilities:**  
- Coordinated sprint planning and task distribution  
- Ensured deadlines were met  
- Contributed to frontend development  

---

### 👤 abidaux  
**Role:** Full Stack Developer  
**Responsibilities:**  
- Implemented authentication system  
- Developed both frontend and backend features  
- Integrated login functionality  

---

### 👤 luguo  
**Role:** Full Stack Developer  
**Responsibilities:**  
- Implemented JWT secret management and authentication security  
- Contributed to backend development  
- Conducted code reviews to ensure quality and consistency

---

## Description

### Project Name: ft_transcendence – Real-Time Rock Paper Scissors Platform

**ft_transcendence** is a complete full-stack web application developed as part of the 42 curriculum.  
The project consists of a real-time multiplayer gaming platform where users can register, authenticate, interact socially, and compete in live **Rock Paper Scissors** matches against other players or an AI opponent.


---

### Project Goal

The main objective of this project was to design and implement a scalable, secure, and interactive full-stack web platform that:

- Supports real-time multiplayer gameplay
- Implements secure user authentication and profile management
- Provides social interaction features (chat, friends system)
- Integrates an AI opponent capable of simulating human-like behavior
- Ensures smooth remote gameplay between users on separate machines
- Demonstrates modern frontend and backend architectural practices

The project emphasizes clean architecture, modularity, security, and real-time synchronization between clients.

---

### Key Features

#### 🎮 Complete Web-Based Game
- Live 1v1 Rock Paper Scissors matches
- Clear game rules and win conditions (Best-of-three decisive rounds)
- Persistent match state stored in the database
- Score tracking and game history
- AI opponent with non-deterministic behavior

#### 🌐 Real-Time Multiplayer (WebSockets)
- Instant move synchronization between players
- Efficient message broadcasting
- Graceful handling of connection/disconnection
- Remote play between users on separate computers
- Reconnection logic and game state recovery

#### 🔐 Authentication & User Management
- Secure authentication system
- JWT-based session management
- Profile page with editable user information
- Avatar upload with default fallback
- Online status tracking

#### 👥 Social Features
- Friends system (add/remove users)
- View friends list and online presence
- Basic real-time chat system between users
- User profile viewing

#### 🧠 AI Opponent
- Playable against a computer-controlled opponent
- Designed to simulate human-like behavior
- Non-perfect play strategy (occasionally makes suboptimal moves)
- Integrated into the same real-time game logic

#### 🎨 Frontend & UX
- Built using modern frontend framework
- Server-Side Rendering (SSR) for improved performance
- Custom reusable design system (minimum 10 reusable UI components)
- Fully responsive interface
- Multi-language support (at least 3 languages)
- Cross-browser compatibility (Chrome + additional browsers)

#### 🗄 Database & Architecture
- ORM-based database management
- Structured relational data model
- Persistent storage for users, games, friendships, and messages
- Modular backend architecture

#### 🐳 Deployment
- Dockerized environment for consistent development and deployment
- Containerized services for backend, frontend, and database
- Production-ready structure

---

### Technical Overview

The application is built using a modern full-stack architecture:

- Frontend framework for dynamic UI and SSR
- Backend framework for API and WebSocket server
- ORM for structured database management
- Real-time WebSocket communication layer
- Docker-based containerized deployment

The system is designed to be scalable, modular, and maintainable, following best practices in web development and software architecture.

---
---

## Instructions

### Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (required to run backend with Fastify)  
- **Bun** (JavaScript runtime for backend)  
- **Next.js** (frontend framework)  
- **Docker & Docker Compose** (for containerized development and deployment)  
- A modern web browser (Chrome, Firefox, Edge, etc.)

---

### Environment Variables (.env)

Create a `.env` file in the project root with the following variables:

```env
DATABASE_URL="file:./app/data/database.sqlite"
JWT_SECRET="change-me"
COOKIES_SECRET="change-me"
BACK_HOST=0.0.0.0
BACK_PORT=3000
NODE_ENV=development

Running the Project
The entire project can be built and run using Docker Compose:
docker compose -f docker/docker-compose.yml up --build
    • This command will automatically start the backend, frontend, and database services.
    • Once running, open your web browser and navigate to:
http://localhost
The website should now be accessible, with full authentication, profile management, and the real-time Rock Paper Scissors game available.
---

## Resources

### References

During the development of **ft_transcendence**, the following resources were extensively used to guide implementation and ensure best practices:

- [Next.js Documentation](https://nextjs.org/docs) – Official documentation for the frontend framework, including Server-Side Rendering (SSR) and routing.  
- [Fastify Documentation](https://www.fastify.io/docs/latest/) – Used for backend framework setup, routing, and WebSocket integration.  
- [WebSocket API – MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) – Reference for real-time communication and event handling.  
- [Prisma / ORM Tutorials](https://www.prisma.io/docs) – Guidance for database schema design and data persistence (if using ORM).  
- Various articles and tutorials on full-stack architecture, Docker, and secure JWT-based authentication.  

These resources were used to understand framework features, best practices, and implementation patterns, and were adapted to the project’s specific requirements.

---

### AI Usage Disclosure

AI tools, such as ChatGPT, were used **sparingly and responsibly** to assist in certain aspects of the project:

- **Documentation and README drafting:** Helped structure and clarify project descriptions, instructions, and explanations for evaluation purposes.  
- **Debugging guidance and code review tips:** Suggested potential solutions for errors or architecture questions during development.  

All AI outputs were **carefully reviewed and adapted** by team members before integration.  
No AI-generated code was used without verification, and all final implementations reflect the team’s original work.

---

## Project Management

### Task Organization
The team followed an **Agile sprint methodology**, organizing work into weekly sprints to track progress and adjust priorities.  
- **Meetings:** One team meeting per week was held to review progress, discuss issues, and plan upcoming tasks.  
- **Task distribution:** Features and modules were assigned to team members based on their roles and expertise.

---

### Project Management Tools
- **Discord** was used for team discussions and daily communication.  
- **Conversation summaries and compte-rendu** were shared to keep everyone aligned and document decisions.  

---

### Communication
- All team coordination, announcements, and technical discussions were conducted via **Discord**.  
- Team members were able to quickly resolve issues and make collective decisions in real time.

---

### Version Control / Workflow
- **Git** was used for version control.  
- Team members created feature branches for their work and submitted **pull requests** for review before merging.  
- Each commit and push included **accurate comments** describing the changes made.  
- This workflow ensured code quality, traceability, and smooth integration of features.

