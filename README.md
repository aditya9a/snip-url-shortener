# Snip: URL Shortener & Analytics Platform

Snip is a high-performance URL shortening service with built-in analytics, dynamic routing, and QR code generation. It is built on the MERN stack with a strict focus on security, data density, and engineering best practices.

## Architecture

This project is structured as a monorepo containing a REST API backend and a Single Page Application (SPA) frontend.

- **Frontend:** React, Vite, React Router, Axios
- **Backend:** Node.js, Express.js (v5)
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT via HTTP-only Cookies
- **Testing:** Vitest, Supertest, MongoMemoryServer

## Features

### Core Functionality
- Generate cryptographically secure, collision-resistant short URLs (`nanoid`).
- Custom alias support with strict URL-safe validation.
- Fast, asynchronous 302 redirect engine for analytics tracking.
- On-the-fly QR code generation for shortened links.

### Analytics Engine
- Parallel MongoDB aggregation pipelines.
- Time-series click tracking.
- Geographic breakdown (via `geoip-lite`).
- Device, browser, and OS parsing (via `ua-parser-js`).
- Referrer tracking.

### Security Implementation
- **Authentication:** HTTP-only cookies to mitigate XSS attacks.
- **Rate Limiting:** Sliding-window rate limiters to prevent brute force attacks on authentication endpoints and API abuse.
- **Data Validation:** Strict runtime type-checking and input sanitization using `zod`.
- **Headers:** Helmet.js for secure HTTP headers.
- **CORS:** Strict origin configuration.

## System Requirements

- Node.js v18.0.0 or higher
- MongoDB instance (local or Atlas)

## Local Development Setup

### 1. Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Configure environment variables:
Create a `.env` file in the `server` directory using the provided example.

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/snip
JWT_SECRET=your_secure_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Start the development server:

```bash
npm run dev
```

### 2. Frontend Setup

Navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend runs with a proxy configured in `vite.config.js` to bypass CORS issues during local development.

## Testing

The backend includes a comprehensive integration test suite using Vitest and `mongodb-memory-server` for isolated database testing.

```bash
cd server
npm test
```

## API Documentation

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create a new user account | No |
| POST | `/api/auth/login` | Authenticate and receive HTTP-only cookie | No |
| POST | `/api/auth/logout` | Clear authentication cookie | No |
| GET | `/api/auth/me` | Retrieve current user profile | Yes |
| POST | `/api/links` | Create a new short link | Yes |
| GET | `/api/links` | Retrieve paginated user links | Yes |
| DELETE | `/api/links/:id` | Delete a specific link | Yes |
| GET | `/api/links/:id/analytics`| Retrieve aggregation analytics for a link | Yes |
| GET | `/api/links/:id/qr` | Generate a base64 QR code | Yes |
| GET | `/:shortCode` | Redirect to original URL | No |

## Design Principles

The frontend strictly adheres to a utilitarian, engineering-led design system. It prioritizes information architecture, data density, and functional spacing over decorative elements. Interactions and feedback states are explicit, and dependencies are kept minimal.

## License

MIT
