# Property Operations Platform

A modular full-stack starter for a PPW-like property management and operations platform.

## Stack
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Prisma ORM
- Database: MySQL
- Authentication: JWT access token, bcrypt password hashing, role-based authorization

## Requirements
Node.js 20+, npm 10+, MySQL 8+

## Quick start
1. Create a MySQL database, e.g. `property_ops`.
2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and `JWT_SECRET`.
3. Copy `client/.env.example` to `client/.env.local`.
4. In `server`: `npm install`, `npx prisma generate`, `npx prisma migrate dev --name init`, `npm run seed`, `npm run dev`.
5. In `client`: `npm install`, `npm run dev`.
6. Open http://localhost:3000.

Seed login: `admin@example.com` / `Admin123!` (change immediately outside local development).

## Architecture
`client/` is the Next.js presentation layer. `server/` owns authentication, authorization, validation, business rules, persistence, and REST APIs. The API uses a metadata-driven resource registry for common CRUD resources and a typed Prisma data model for users, records, and audit events. Each record has a module key and JSON payload so the starter can support evolving operational forms without scattering database changes across every screen. For production, promote high-volume entities (properties, units, work orders, invoices, vendors) into dedicated relational Prisma models and migrations.

## Implemented capabilities
- Login/logout, password hashing, JWT authentication
- Role-based module access enforced by API middleware
- 17 module workspaces with list, search, create, edit, view and archive/delete flows
- Dashboard counts, recent activity, global search
- Server-side pagination and filtering
- Audit log entries for record changes
- Responsive sidebar and professional SaaS layout
- API health endpoint and Prisma seed

## Integrations requiring customer credentials
Gmail/Microsoft Graph, Twilio/VoIP, SMS, payment gateways, Google Maps, cloud object storage, e-signature, and push notifications are integration adapters only at this stage. They require provider accounts, credentials, consent, and business-specific configuration. Call recording must be enabled only after legal review and required consent.

## QA performed
The project package structure, TypeScript source, Prisma schema, route contracts, and environment templates are included. Run `npm run typecheck` in both applications and `npx prisma validate` in `server` after configuring your local environment. A live end-to-end QA pass requires installing dependencies and connecting to your own MySQL instance; no external credentials or production environment were supplied.
