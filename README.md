# Business Coaching Platform

A modern, high-performance platform for coaches and creators to manage offerings, bookings, and digital products. Built with React, Vite, Tailwind CSS, and Supabase.

## Features

- **Storefront & Offerings:** Showcases coaching packages, digital products, and courses with dynamic routing.
- **Booking Integration:** Seamless integration with Cal.com for scheduling and synchronizing meetings.
- **Secure Authentication:** User sign-up and login flows powered by Supabase Auth.
- **Comments & Engagement:** Nested, threaded commenting system on offerings with image upload support.
- **Newsletter Management:** Integrated newsletter dispatch and scheduling via Supabase Edge Functions.
- **Error Tracking:** Real-time production error monitoring configured via Sentry.
- **Admin Dashboard:** Centralized control for managing the catalog, users, reviews, and website settings.

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS (v4), Zustand (State), React Router
- **Backend & Database:** Supabase (PostgreSQL, Edge Functions, Storage, Auth)
- **UI Components:** Radix UI, Shadcn, GSAP (Animations), Floating UI
- **Error Tracking:** Sentry (`@sentry/react`)

---

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and configure the required variables. Example configuration:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Error Tracking (Optional for local dev)
VITE_SENTRY_DSN="https://example@o12345.ingest.sentry.io/67890"

# Cal.com Booking
VITE_CALCOM_DEFAULT_HOST_ID=default-host
```

### 3. Run the Development Server
```bash
npm run dev
```

---

## Integrations & Supabase Configuration

### Cal.com Booking Sync
This project supports auto-provisioned Cal.com event types for offerings saved from the admin.

**Supabase Edge Function Secrets (`supabase/functions/sync-booking-offering`):**
```env
CALCOM_USERNAME=your-calcom-username
CALCOM_API_KEY=cal_xxx
CALCOM_WEBHOOK_SECRET=replace-with-a-long-random-secret
```

**Booking History Webhook:**
Confirmed Cal.com sessions are saved to `storefront_booking_access` so signed-in customers can see them under **My Meetings**.
1. Apply `supabase/add_booking_access.sql`.
2. Deploy the webhook function: `supabase functions deploy cal-booking-webhook --no-verify-jwt`
3. Configure the webhook in Cal.com pointing to `https://<your-project-ref>.supabase.co/functions/v1/cal-booking-webhook`.

### Newsletter Production Setup
1. Apply `supabase/add_newsletter_production_features.sql`.
2. Deploy the required Edge Functions:
   - `newsletter-dispatch`
   - `newsletter-unsubscribe`
   - `newsletter-scheduler`
3. Schedule `newsletter-scheduler` from Supabase cron for daily dispatching.

**Resend & Email Secrets:**
```env
RESEND_API_KEY=re_xxx
EMAIL_FROM="Your Brand <sender@example.com>"
SITE_URL=https://your-site.com
```

### Sentry Error Logging
To enable production error tracking, simply add your Sentry project DSN to your environment variables:
`VITE_SENTRY_DSN="your-dsn-here"`

If this value is missing (e.g., during local development), the application will cleanly default to console logging without attempting to contact Sentry.

---

*Note: For upcoming tasks, requirements, and development ideas, see [ROADMAP.md](./ROADMAP.md).*
