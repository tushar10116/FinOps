# FinOps Cloud Cost Management

Full-stack starter for a cloud cost management product with a custom Tailwind-based UI, an Express API, authentication, and shared TypeScript contracts.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Query
- Lucide React
- Zod
- Express.js + TypeScript
- Routed login and register flow
- Token-based protected dashboard
- MongoDB-backed authentication and session storage

## Project Layout

- `client/` - Vite frontend and UI shell
- `server/` - Express API
- `shared/` - shared TypeScript types
- Authentication endpoints live under `/api/auth/*`

## Scripts

- `npm run dev` - start the frontend and backend in development
- `npm run build` - build the backend and frontend
- `npm run start` - start the built backend server
- `npm run typecheck` - run type checks across the workspaces

## Getting Started

1. Install dependencies with `npm install`.
2. Set `MONGODB_URI` to your MongoDB connection string. `MONGODB_DB_NAME` defaults to `finops`.
3. Start development with `npm run dev`.
4. Register or sign in, then replace the empty-state scaffold with your custom product screens and API logic.
