# Tasks & Work Backend

A modular, multi-tenant task and work-management API built for Cloudflare Workers.

## Included foundations

- organization registration and email/password sessions;
- tenant-scoped users, memberships, roles and teams;
- contacts and client records;
- projects and project membership;
- tasks, subtasks, assignees, followers and checklists;
- comments and mentions;
- time-entry schema;
- in-app notifications and preferences;
- queued Resend email, EgoSMS SMS and ULIB WhatsApp Hub delivery;
- signed WhatsApp webhook verification and duplicate protection;
- scheduled due-soon and overdue reminders;
- audit-ready and pagination-ready schema.

## Module structure

Each domain lives in `src/modules/<module>`. A module can own `routes.ts`, `service.ts`, `repository.ts`, `schema.ts` and `types.ts`. Shared platform code stays in `src/core`; external providers stay in `src/communications`. Adding a future CRM, approvals, calendar or finance module does not require restructuring existing modules.

## Local setup

```bash
npm install
cp .dev.vars.example .dev.vars
npx wrangler d1 create tasks-work-db
npx wrangler r2 bucket create tasks-work-files
npx wrangler queues create tasks-work-notifications
npx wrangler queues create tasks-work-notifications-dlq
```

Copy the D1 database ID into `wrangler.toml`, then run:

```bash
npm run db:local
npm run dev
```

## Production secrets

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put WHATSAPP_SUPPORT_APP_KEY
npx wrangler secret put WHATSAPP_SUPPORT_WEBHOOK_SECRET
npx wrangler secret put EGOSMS_USERNAME
npx wrangler secret put EGOSMS_PASSWORD
npx wrangler secret put EGOSMS_SENDER_ID
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM_EMAIL
```

Provider credentials must never be committed or exposed to the frontend.

## Initial API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Service health |
| `POST` | `/v1/auth/register` | Create organization and owner |
| `POST` | `/v1/auth/login` | Create session |
| `POST` | `/v1/auth/logout` | Revoke session |
| `GET` | `/v1/auth/me` | Current account |
| `GET` | `/v1/organization` | Current organization |
| `GET` | `/v1/members` | Organization members |
| `GET/POST` | `/v1/teams` | Teams |
| `GET/POST` | `/v1/contacts` | Contacts |
| `GET` | `/v1/contacts/:id` | Contact detail |
| `DELETE` | `/v1/contacts/:id` | Archive contact |
| `GET/POST` | `/v1/projects` | Projects |
| `GET` | `/v1/projects/:id` | Project detail |
| `GET/POST` | `/v1/tasks` | Tasks |
| `GET` | `/v1/tasks/:id` | Task detail |
| `PATCH` | `/v1/tasks/:id/status` | Task workflow status |
| `GET/POST` | `/v1/tasks/:id/comments` | Comments and mentions |
| `GET` | `/v1/notifications` | Current user's notifications |
| `POST` | `/v1/notifications/:id/read` | Mark notification read |
| `POST` | `/v1/notifications/read-all` | Mark all read |
| `POST` | `/v1/webhooks/whatsapp` | Signed Hub webhook |

Authenticated endpoints use `Authorization: Bearer <session-token>`.

## WhatsApp Hub registration

Register this endpoint in the ULIB Hub:

```text
https://YOUR-WORKER.workers.dev/v1/webhooks/whatsapp
```

The receiver verifies the exact raw body using `X-Support-Signature` and deduplicates deliveries using `X-Support-Delivery-Id`.

## Current phase

This repository contains the deployable backend foundation. The next modules should add invitations and membership management, full project/task updates, file uploads, checklists, time tracking, approvals, dashboard reports, and task-specific WhatsApp command workflows.
