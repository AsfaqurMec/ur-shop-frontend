# Digital Products – Frontend

Next.js App Router frontend for the digital products ecommerce platform.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**

## Setup

```bash
cp .env.example .env.local
# Edit .env.local: set PUBLIC_API_URL to your backend (e.g. http://localhost:5000/api)

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- **`app/`** – App Router routes and layouts
  - **`(public)/`** – Public pages (home, products) with shared header
  - **`(auth)/`** – Login, register (centered card layout)
  - **`(dashboard)/`** – Customer dashboard (sidebar nav)
  - **`(admin)/`** – Admin area (sidebar nav)
- **`components/`** – Reusable components
  - **`ui/`** – Button, Card, Input, Spinner, Alert, Container
  - **`layout/`** – PublicHeader, DashboardNav, AdminNav
- **`lib/api/`** – API client (`apiGet`, `apiPost`, etc.) and auth token handling (localStorage key `auth_token`)

## Auth

The API client sends `Authorization: Bearer <token>` when a token is present. Store the access token after login with `setAuthToken(token)`. On 401, the client clears the token and redirects to `/login`.

## Scripts

- `npm run dev` – Development server
- `npm run build` – Production build
- `npm run start` – Start production server
- `npm run lint` – Run ESLint
"# Digital-Products-Selling--Frontend" 
