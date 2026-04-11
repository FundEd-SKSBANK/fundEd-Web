# FundEd - Student Payment & Event Management System

FundEd is a modern, full-stack web application designed to streamline event payment tracking and student management for educational institutions. It features a premium, **Glassmorphism-inspired UI** with comprehensive mobile responsiveness and a robust admin dashboard for managing transactions, students, and events.

**FundEd** is a core module of **SKS DM (Classroom OS)**, bringing transparency and efficiency to student fund management.

![FundEd Banner](/public/funded-icon.png)    

---

## ✨ Key Features

### 🎓 Student Portal
- **Workspace-Scoped Status Check**: Each admin gets a unique public URL (`/check-status/[slug]`). Students visit their institution's specific link and search by Name or Roll Number — results are isolated to that admin's workspace only.
- **Payment Ledger**: Detailed view of paid, due, and verified transactions per event.
- **Mobile Responsive**: Fully optimized for mobile devices (353px+ width).

### 🛡️ Admin Dashboard
- **Student Management**: Add, search, upload CSV, and manage student records.
- **Event Management**: Create and track multiple events with individual costs, deadlines, and payment options.
- **Payment Processing**:
    - **Multiple Payment Methods**: Razorpay, QR Code, Cash, and Manual Entry.
    - **QR Code Upload**: Drag & drop support for payment screenshots.
    - **Cash Payment Recording**: Record cash payments with receipt number, date picker, and notes. Automatically filters out already-paid students.
    - **Verification Workflow**: Mark payments as Paid, Pending, or Failed.
    - **Receipt Generation**: Auto-generate downloadable PDF receipts.
- **Reports & Analytics**:
    - Generate transaction, event-wise, and student-wise reports.
    - Export to CSV and PDF formats.
    - Visual statistics and collection progress tracking.
- **Expense Tracking**:
    - Log itemized event expenses with categories and bill uploads.
    - Track **Additional Income Sources** (Sponsors, Donations, Class Fund, etc.) per event — with full CRUD support.
- **Print Distribution**:
    - Dedicated interface for tracking physical material distribution.
    - QR code scanning support for quick distribution.
    - Real-time stock and distribution status monitoring.
    - Delete incorrect distribution records with confirmation.
- **Settings**:
    - Manage UPI payment QR codes with auto-validation.
    - **Student Portal Link**: Set a unique slug for your workspace's public check-status URL.
    - **Collab Users**: Create and manage assistant/team accounts under your admin workspace.

### 🔗 Major Events (Cross-Admin Collaboration)
- **Major Event Type**: Create umbrella events that aggregate payment data from multiple connected sub-events managed by different admins.
- **Token-Based Connection**: Major Event admins generate time-limited cryptographic connection tokens. Sub-event admins paste the token to link their event.
- **Pending Approval Workflow**: Connections are initiated as `PENDING` and require approval from the Major Event admin.
- **Manage Connections Page**: A dedicated UI per event (`/dashboard/events/[eventId]/connections`) to view, approve, and revoke connected sub-events.
- **Disconnect Support**: Sub-event admins can disconnect from a Major Event at any time.

### 👥 Collab Users (Team Management)
- Admins can create **Collab** (assistant) accounts that share access to their workspace data.
- Collab users can be created, edited, and deleted directly from the Settings page.
- Collab users operate within the same tenant isolation as their parent admin.

### 🔐 Secure OTP Signup
- **3-Step Registration Flow**: Name/Email → OTP Verification → Password Setup.
- OTP is sent to the user's email and validated server-side before account creation is allowed.
- A 30-second resend cooldown with a live countdown timer prevents OTP abuse.
- Animated step indicator clearly shows progress through the flow.

### 📊 Superuser Dashboard
- **Platform-Wide Analytics**: View aggregated stats across all admin accounts — total students, events, revenue, and expenses.
- **Revenue vs. Expense Chart**: Area chart showing 7-day financial trends across the whole platform.
- **Expense Breakdown Chart**: Pie/donut chart of expense categories across all events.
- **Admin Management Table**: Create, activate, and manage all admin accounts from one place.
- **Global Financials Table**: Per-event financial breakdown (Collected, Expenses, Net Balance) with search and mobile card view. Negative net balances are correctly clamped to zero in platform totals.
- **Superadmin Notifications**: Receive in-dashboard alerts when new users register.

### 🎨 UI/UX Design
- **Glassmorphism**: A unified, translucent frosted-glass aesthetic across the entire app.
- **Dark Mode**: A sleek, emerald-themed dark interface with animated background orbs.
- **Smooth Animations**: Fluid transitions, micro-interactions, and custom cursor effects.
- **Mobile First**: Fully responsive design optimized for screens as small as 353px width.
- **Unified Authentication**: Login, Forgot Password — on a single dynamic page. Signup is a seamless 3-step wizard.
- **Premium Communication**: Branded email templates with the "Classroom OS" aesthetic for all transactional emails.
- **Custom Components**: Branded loaders, glass cards, and interactive elements.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **UI Components** | [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/) |
| **Auth** | Custom session-based auth (bcrypt + httpOnly cookies + edge-compatible JWT) |
| **Payment** | Razorpay |
| **PDF Generation** | jsPDF + autoTable |
| **Email** | Nodemailer / transactional email service |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Utilities** | `clsx`, `tailwind-merge`, `date-fns` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud like [Neon](https://neon.tech/) / Supabase)

### Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/FundEd-SKSBANK/fundEd-Web.git
    cd fundEd-Web
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Configure Environment Variables**

    Create a `.env` file in the root directory:
    ```env
    # Database Connection (Neon or local PostgreSQL)
    DATABASE_URL="postgresql://user:password@host:5432/funded_db?sslmode=require"
    DIRECT_URL="postgresql://user:password@host:5432/funded_db?sslmode=require"

    # Authentication
    NEXTAUTH_SECRET="your-secret-key-here"
    NEXTAUTH_URL="http://localhost:9002"

    # App Config
    NEXT_PUBLIC_APP_URL="http://localhost:9002"

    # Razorpay (Optional - for payment integration)
    RAZORPAY_KEY_ID="your-razorpay-key-id"
    RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

    # Email (for OTP & notifications)
    SMTP_HOST="smtp.example.com"
    SMTP_PORT="587"
    SMTP_USER="your@email.com"
    SMTP_PASS="your-password"
    ```

4. **Setup Database**
    ```bash
    npx prisma db push
    npx prisma generate
    ```

5. **Create Admin User**
    ```bash
    npm run seed
    ```
    Default credentials: `admin@funded.com` / `admin123`

6. **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) to view the application.

---

## 📂 Project Structure

```bash
fundEd-Web/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seeding
├── public/                     # Static assets
├── scripts/                    # Utility scripts
├── src/
│   ├── actions/                # Server Actions (Data mutations)
│   │   ├── auth.ts             # Login, signup, OTP, forgot/reset password
│   │   ├── events.ts           # Event CRUD
│   │   ├── major-events.ts     # Major Event tokens & connections
│   │   ├── expenses.ts         # Expense + Additional Revenue CRUD
│   │   ├── manual-payments.ts  # Cash payment recording
│   │   ├── students.ts         # Student management
│   │   ├── users.ts            # Collab user management
│   │   ├── settings.ts         # QR codes & slug management
│   │   └── super/              # Superadmin-only actions
│   │       └── analytics.ts    # Platform stats, financials, charts
│   ├── app/                    # Next.js App Router pages
│   │   ├── check-status/       # Public Student Portal (slug-scoped)
│   │   ├── dashboard/          # Admin Protected Area
│   │   │   ├── events/         # Event management + Major Event connections
│   │   │   │   └── [eventId]/  # Per-event expense, connections pages
│   │   │   ├── prints/         # Print distribution tracking
│   │   │   ├── reports/        # Reports & analytics
│   │   │   ├── settings/       # QR, slug, collab users
│   │   │   ├── students/       # Student management
│   │   │   ├── super/          # Superuser dashboard (admin mgmt, financials)
│   │   │   └── page.tsx        # Dashboard home
│   │   ├── login/              # Unified login + forgot password
│   │   ├── signup/             # 3-step OTP signup wizard
│   │   ├── reset-password/     # Password reset
│   │   ├── privacy/            # Privacy policy
│   │   ├── terms/              # Terms of service
│   │   ├── support/            # Support form
│   │   └── page.tsx            # Landing page
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # Shadcn primitives + custom glass-card, page-loader
│   │   ├── additional-revenue-panel.tsx  # Income source CRUD panel
│   │   ├── admin-management-table.tsx    # Superadmin admin table
│   │   ├── collab-management.tsx         # Collab user management
│   │   ├── expense-table.tsx             # Expense tracking table
│   │   ├── record-cash-payment-dialog.tsx # Cash payment dialog
│   │   ├── super-analytics-charts.tsx    # Revenue + expense charts
│   │   ├── super-financials-table.tsx    # Global financials table
│   │   ├── super-stats-cards.tsx         # Platform stat cards
│   │   ├── statistics-chart.tsx          # Admin-level collection chart
│   │   ├── custom-cursor.tsx             # Custom cursor effect
│   │   ├── mouse-follower.tsx            # Mouse glow follower
│   │   └── ...
│   ├── lib/                    # Utilities & Types
│   │   ├── auth.ts             # Session auth (Node runtime)
│   │   ├── auth-edge.ts        # Session auth (Edge runtime for middleware)
│   │   ├── db.ts               # Prisma client (singleton)
│   │   ├── types.ts            # TypeScript types
│   │   └── utils.ts            # Helper functions
│   └── middleware.ts           # Route protection + role-based redirects
└── package.json
```

---

## 🎯 Recent Updates

### OTP Email Verification for Signup (v1.6.0)
- ✅ **3-Step Signup Wizard**: Enforced `Name/Email → OTP → Password` flow — users cannot skip verification.
- ✅ **Server-Side OTP Validation**: OTP is generated and validated via server actions, never trusted client-side.
- ✅ **30-Second Resend Cooldown**: Live countdown timer with a resend button that becomes active after the timer expires.
- ✅ **Animated Step Indicator**: Visual step tracker with checkmark icons on completion.
- ✅ **Superadmin Notification**: Superadmin is notified via email when a new admin registers.

### Major Events & Cross-Admin Collaboration (v1.5.5)
- ✅ **Major Event Category**: New event type that aggregates data from linked sub-events — no direct student payments.
- ✅ **Token Generator**: Major Event admins generate labeled, time-limited tokens (7 or 30 day expiry) with countdown display.
- ✅ **Sub-Event Connection**: Sub-event admins paste a token to request a connection; status starts as `PENDING`.
- ✅ **Connections Management Page**: Approve, view, and revoke connections per Major Event.
- ✅ **Disconnect Flow**: Sub-event admins can disconnect from a Major Event with a confirmation dialog.
- ✅ **Post-Publish Success Modal**: After creating a Major Event, a modal guides the admin straight to the connections page.

### Collab Users & Team Management (v1.5.3)
- ✅ **Collab User Accounts**: Admins can create assistant users who share access to their workspace.
- ✅ **Full CRUD**: Create, edit (name, email, password), and delete collab users from the Settings page.
- ✅ **Role Isolation**: Collab users cannot access superadmin or other admin workspaces.

### Superuser Analytics Dashboard (v1.5.2)
- ✅ **Platform Stats Cards**: Platform-wide totals — admins, students, events, revenue, expenses, net balance.
- ✅ **Revenue vs. Expense Chart**: Area chart of 7-day financial delta across all events.
- ✅ **Expense Breakdown Chart**: Pie chart of expense categories aggregated across the platform.
- ✅ **Global Financials Table**: Per-event financial breakdown with search, mobile card view, and clamped net balance.

### Additional Income Sources (v1.5.1)
- ✅ **Additional Revenue Panel**: Log non-student income (Sponsors, Donations, Class Fund, etc.) per event.
- ✅ **Full CRUD**: Add, edit, and delete income entries with source categorization and optional notes.
- ✅ **Integrated into Net Balance**: Additional revenue is factored into event-level profit/loss calculations.

### Unified Auth & Premium Communication (v1.5.0)
- ✅ **Unified Login Page**: Login and Forgot Password merged into a single dynamic page with smooth view transitions.
- ✅ **Premium Email Branding**: All outgoing emails (OTP, Reset Password, Receipts) use GraduationCap + Classroom OS branding.
- ✅ **Edge-Compatible Middleware**: Auth middleware refactored with `auth-edge.ts` to prevent Netlify/Vercel 500 errors.
- ✅ **Port Standardization**: Unified local development fallback port to `9002`.

### Admin Workspace Isolation & Student Portal (v1.4.0)
- ✅ Each admin workspace now gets a **unique public check-status URL** (`/check-status/[slug]`).
- ✅ Student search results are **fully scoped** to the admin's workspace — no cross-tenant data leakage.
- ✅ New **Student Portal Link** card in Settings: set your slug, preview URL, and copy link button.
- ✅ Old `/check-status` now shows an informational redirect page.

### Cash Payment Recording (v1.3.5)
- ✅ Dedicated **Record Cash Payment** dialog with event-first selection flow.
- ✅ Automatically filters out students who have already paid for the selected event.
- ✅ Supports receipt number, custom payment date (calendar picker), and notes.

### Print Distribution Improvements (v1.3.0)
- ✅ Admins can now **delete incorrect print distributions** with a confirmation dialog.
- ✅ Fixed page refresh glitch on event selection in the print page.

### Expense Quick Access (v1.2.0)
- ✅ Collapsible Expenses section in the sidebar with direct event links.
- ✅ Dashboard card showing active events with direct links to expense pages.

### Mobile Responsive Improvements (v1.1.0)
- ✅ Fixed homepage navigation button overflow on 353px screens.
- ✅ Optimized dashboard header for mobile (compact icons, reduced padding).
- ✅ Fixed stats cards overflow with proper width constraints.
- ✅ Made reports transaction table horizontally scrollable on mobile.

---

## 🔐 Authentication

The application uses custom session-based authentication:

- Admin users log in at `/login`; new users register at `/signup` (OTP required).
- Sessions are stored securely with **httpOnly cookies** using JWT.
- Passwords are hashed with **bcrypt**.
- Route protection is enforced via **Next.js Middleware** using an edge-compatible JWT decoder.
- Superadmin logins are automatically redirected to `/dashboard/super`.

---

## 📊 Database Schema

| Model | Purpose |
|---|---|
| `User` | Admin accounts with unique `slug`, role (`admin` / `collab` / `superadmin`) |
| `Student` | Student records, workspace-isolated via `createdById` |
| `Event` | Fund collection events with categories (`Normal`, `Print`, `MajorEvent`) |
| `Payment` | Transactions linking Student ↔ Event with method and verification status |
| `Expense` | Itemized event costs with category and bill upload support |
| `AdditionalRevenue` | Non-student income sources logged per event |
| `PrintDistribution` | Fulfillment tracking per Event/Student |
| `QrCode` | UPI payment QR codes managed per admin |
| `MajorEventConnection` | Token-based connections linking sub-events to Major Events |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🏢 About

**FundEd** is a sub-product of **SKS DM** (Classroom OS), designed to bring transparency and efficiency to student fund management in educational institutions.

---

Made with ❤️ by the FundEd Team
