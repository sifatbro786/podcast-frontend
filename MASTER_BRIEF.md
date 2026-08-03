1. Executive Summary & Client Info
Website Remake Target: PodcastChartGrowth.com (Brand: Mission Podcast Growth)

Primary Goal: Transform the existing landing page into an Awwwards-caliber, high-converting, premium agency web application with GSAP animations, dynamic Light/Dark mode, and an intuitive Admin Lead Management system.

Client Contact Details:

Email: Mission2016start@gmail.com

Phone / WhatsApp: +880 1710-368102

Infrastructure Provided: Client VPS, Custom Domain, SSL, MongoDB URI, SMTP App Password.

2. Frontend Specifications & Tailwind v4 Theme
Typography & Theme Tokens (src/index.css for Tailwind v4)
CSS
@import "tailwindcss";

@theme {
  --font-sans: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  /* Brand Specific Colors */
  --color-brand-orange: #FF5722;
  --color-brand-orange-hover: #E64A19;
  --color-brand-amber: #F59E0B;
  
  /* Dark Theme Default Variables */
  --color-dark-bg: #0F172A;
  --color-dark-card: #1E293B;
  --color-dark-border: #334155;
  --color-dark-text: #F8FAFC;
  --color-dark-muted: #94A3B8;

  /* Light Theme Variables */
  --color-light-bg: #FAFAFA;
  --color-light-card: #FFFFFF;
  --color-light-border: #E2E8F0;
  --color-light-text: #0F172A;
  --color-light-muted: #64748B;
}

/* Custom CSS Rules & Theme Classes */
:root {
  color-scheme: dark;
}

.light {
  color-scheme: light;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-dark-bg);
  color: var(--color-dark-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.light body {
  background-color: var(--color-light-bg);
  color: var(--color-light-text);
}
Page Sections & Data Specification
Header / Navbar: Logo, Navigation links (Services, Process, Guest Booking, Contact), Theme Toggle (Light/Dark), Primary CTA ("Free Test").

Hero Section: GSAP Animated Headlines, Live Growth Indicator Widget, Stat Counters (10+ Years Experience, Apple + Spotify, 3-Day Free Test).

Services Section ("What We Do"):

Podcast Growth Campaigns

Apple & Spotify Visibility

Audio Post-Production

NEW SECTION: Podcast Guest Booking & Category Directory:

Fields: Full Name, Phone Number, Selected Category.

Categories List: News, Comedy, Society & Culture, Business, True Crime, Sports, Health & Fitness, Religion & Spirituality, Arts, Education, History, TV & Film, Science, Technology, Music, Kids & Family, Leisure, Government.

How It Works (Process): Interactive 4-step vertical/horizontal timeline with sticky scroll effects.

Why Mission / Ethical Charter: Transparency badge (Anti-fake charts/reviews statement).

Contact / Free Review Lead Form:

Full Name (Input)

Business Email (Input)

Podcast Link (Input: Apple/Spotify URL)

Primary Goal (Dropdown Options): Select a goal, Audience growth, Chart visibility, Episode promotion, Audio editing

Target Market (Dropdown Options): USA, UK, Canada, Australia, Global

Additional Details (Textarea: "Anything we should know?")

Footer: Contact details, quick links, dynamic year, and disclaimer.

3. Backend Architecture (Node.js, Express, MongoDB)
Directory Structure
Plaintext
backend/
├── config/
│   ├── db.js             # MongoDB Connection Setup
│   └── mailer.js         # Nodemailer Transporter Configuration
├── controllers/
│   ├── authController.js # Admin Login, Forgot Password, Reset Password, Change Password
│   ├── leadController.js # Contact Leads CRUD & Excel Export
│   └── guestController.js# Guest Booking CRUD & Excel Export
├── middleware/
│   ├── authMiddleware.js # JWT Protection & Rate Limiting
│   └── errorMiddleware.js# Centralized Error Handler
├── models/
│   ├── Admin.js          # Admin Schema (Email, Password Hash, Reset Token)
│   ├── Lead.js           # Contact Form Schema
│   └── Guest.js          # Guest Booking Schema
├── routes/
│   ├── authRoutes.js     # Auth API Routes
│   ├── leadRoutes.js     # Lead API Routes
│   └── guestRoutes.js    # Guest Booking API Routes
├── utils/
│   ├── excelExporter.js  # Convert MongoDB JSON to Excel (.xlsx) Buffer
│   └── emailTemplates.js # HTML Email Templates (Forgot Password & Lead Notification)
├── .env.example
├── server.js             # Main Server Entry Point
└── package.json
Key Backend Features:
Excel Data Export: Admin dashboard can trigger /api/leads/export and /api/guests/export to download data in clean .xlsx format (using exceljs library).

Forgot Password Email Flow:

Generates crypto reset token + expiry time.

Sends a modern, branded HTML Email Template (using client's SMTP App Password).

Admin Dashboard Security: JWT based bearer auth with password encryption using bcryptjs.

4. Step-by-Step Development Execution Plan
[ ] Phase 1: Backend Base Setup

Project setup, Folder Structure, Express server configuration, MongoDB connection.

Setup Models (Admin, Lead, Guest).

[ ] Phase 2: Controllers & Email System

Implement Auth Controller (Login, Forgot Password with HTML Email, Password Reset, Change Password).

Implement Lead & Guest Controllers with Excel Export utility (exceljs).

[ ] Phase 3: Admin API Routes & Testing

Protect routes with authMiddleware.js.

API endpoint verification via Postman.

[ ] Phase 4: Frontend & Tailwind v4 Setup

Configure src/index.css with @theme variables and Google Font Nunito.

Setup Light/Dark Theme Context and Layouts.

[ ] Phase 5: GSAP Animations & UI Components

Build Hero, Services, Guest Booking Section, Process, and Contact Form.

Integrate GSAP ScrollTrigger and micro-interactions.

[ ] Phase 6: Backend Integration & Admin Dashboard

Connect React Forms with Node.js API endpoints.

Build Admin Dashboard Table with Live Status Updates & Excel Export Button.

[ ] Phase 7: Deployment & Final Delivery

Deploy Backend and Frontend to VPS.

Setup SSL, Environment Variables, and domain routing.