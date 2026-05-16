# SwiftDrop: High-Concurrency Flash Sale Platform

SwiftDrop is a robust, event-driven marketplace built to handle massive, instantaneous spikes in traffic (500-1000 concurrent users) during limited-quantity flash sales.

## The Concurrency Problem & Solution

The core challenge of SwiftDrop is preventing race conditions, overselling, and server crashes when hundreds of users simultaneously attempt to purchase a single item the second an event opens.

### How Our Architecture Solves This:
1. **Load Balancing & Rate Limiting (Nginx):** 
   - All traffic hits Nginx first. It distributes the load across multiple Node.js backend instances to maximize throughput.
   - It enforces Rate Limiting (`limit_req_zone`). If traffic exceeds capacity, it gracefully returns a structured `429 Too Many Requests` JSON response instead of bringing down the backend servers.
2. **Atomic In-Memory Reservation (Redis + Lua):**
   - The `/api/purchase/reserve` endpoint **does not** touch the PostgreSQL database.
   - Instead, it executes a single, atomic Lua script inside Redis. Because Redis is single-threaded, it evaluates the script sequentially. The script checks if stock > 0, checks if the user already bought the item, decrements the stock, and creates a reservation. This guarantees **Zero Overselling**.
3. **Data Integrity (PostgreSQL):**
   - Once the reservation is secured in memory, the user is presented with a payment confirmation screen.
   - Upon confirmation, a robust PostgreSQL transaction creates the definitive Order record and decrements the DB stock to maintain long-term consistency.
4. **Real-time Updates (Server-Sent Events):**
   - Stock decrements in Redis instantly trigger a broadcast via SSE to all connected clients, updating their UI without requiring them to spam the server with refresh requests.

---

## Local Setup Instructions

### Prerequisites
- Docker and Docker Compose installed.
- Node.js (v18+) for local dev (optional if strictly using Docker).

### Environment Variables
Environment variables are pre-configured in the `docker-compose.yml` for seamless local setup.
- `DATABASE_URL`: `postgresql://swiftdrop:swiftdrop_password@postgres:5432/swiftdrop_db?schema=public`
- `REDIS_URL`: `redis://redis:6379`
- `JWT_SECRET`: `super_secret_jwt_key_123`

### Starting the Platform
From the root directory of the repository, run:
```bash
docker-compose up --build
```
This will start:
- PostgreSQL (Port: 5432)
- Redis (Port: 6379)
- Backend Instance 1 & 2 (Ports: 3001, 3002)
- Nginx Load Balancer (Port: 8080)
- React Frontend (Port: 3000)

### Database Migrations & Seeding
Once the containers are running, you need to set up the database schema and seed the initial Admin account and dummy events.
Open a new terminal, and run:
```bash
docker-compose exec backend1 npm run prisma:migrate
docker-compose exec backend1 npm run seed
```

### Accessing the Platform
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **API Base URL**: `http://localhost:8080/api`

**Admin Login:**
- Email: `admin@swiftdrop.com`
- Password: `admin123`

**Test Customer Login:**
- Email: `customer@swiftdrop.com`
- Password: `customer123`

## Architecture Diagram
The architecture diagram `architecture.mmd` is located in the root folder. You can use the Mermaid Live Editor (https://mermaid.live/) to view it or render it using the mermaid CLI:
`npx -p @mermaid-js/mermaid-cli mmdc -i architecture.mmd -o architecture.png`
