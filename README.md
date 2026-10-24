# Hospital Management System - MongoDB Edition

This version uses **MongoDB only**. MySQL, mysql2 and Drizzle database migrations are no longer required.

## 1. Install

```bash
npm install
```

## 2. Configure MongoDB

The shared project ZIP intentionally excludes any real `.env` file so database credentials and API keys are not shared. Create `.env` from `.env.example` and set the values for your own environment:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=hospital_management
ADMIN_EMAIL=admin@hospital.com
ADMIN_PASSWORD=Admin@123
JWT_SECRET=change-this-secret
PORT=3000
```

You can use MongoDB Atlas free tier or a local MongoDB server.

## 3. Start

```bash
npm run dev
```

Open http://localhost:3000

## Database collections

- `users` - normal registrations and administrator account
- `contactMessages` - Contact Us submissions
- `patients` - hospital patient records
- `appointments` - appointment records
- `inventoryItems` - pharmacy/inventory records

Indexes are created automatically when the application connects.

## Login

Normal user: register first at `/register`, then login.

Administrator:
- Email: `admin@hospital.com`
- Password: `Admin@123`

Admin access is protected by a server-side role check.


## Password reset by email OTP

Normal users can open **Forgot password? Reset with OTP** on the login page. The server sends a six-digit code to the registered email address; codes expire after 10 minutes and are limited to five verification attempts. A resend cooldown is applied.

Configure a Resend account and API key in `.env`:

```env
RESEND_API_KEY=re_your_resend_api_key
PASSWORD_RESET_FROM=CareVista Hospital <onboarding@resend.dev>
APP_BASE_URL=http://localhost:3000
```

The `onboarding@resend.dev` sender is for testing with the provider's permitted recipients. Before production, verify a domain with Resend and set `PASSWORD_RESET_FROM` to an email address on that domain. Never commit `.env` or share the API key. Without a configured email provider, password-reset emails cannot be delivered.

## Service and department details

Each Services and Departments card opens a dedicated detail page with expanded descriptions, key areas, user guidance and next steps. The About page describes CareVista's purpose, guiding principles, platform capabilities and account access model.
