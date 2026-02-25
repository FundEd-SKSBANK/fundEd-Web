# FundEd - Student Payment & Event Management System

FundEd is a modern, full-stack web application designed to streamline event payment tracking and student management for educational institutions. It features a premium, **Glassmorphism-inspired UI** with comprehensive mobile responsiveness and a robust admin dashboard for managing transactions, students, and events.

**FundEd** is a core module of **SKS DM (Classroom OS)**, bringing transparency and efficiency to student fund management.

![FundEd Banner](/public/funded-icon.png)    

## ✨ Key Features

### 🎓 Student Portal
-   **Workspace-Scoped Status Check**: Each admin gets a unique public URL (`/check-status/[slug]`). Students visit their institution's specific link and search by Name or Roll Number — results are isolated to that admin's workspace only.
-   **Payment Ledger**: Detailed view of paid, due, and verified transactions per event.
-   **Mobile Responsive**: Fully optimized for mobile devices (353px+ width).

### 🛡️ Admin Dashboard
-   **Student Management**: Add, search, upload CSV, and manage student records.
-   **Event Management**: Create and track multiple events with individual costs, deadlines, and payment options.
-   **Payment Processing**:
    -   **Multiple Payment Methods**: Razorpay, QR Code, Cash, and Manual Entry.
    -   **QR Code Upload**: Drag & drop support for payment screenshots.
    -   **Verification Workflow**: Mark payments as Paid, Pending, or Failed.
    -   **Receipt Generation**: Auto-generate downloadable PDF receipts.
-   **Reports & Analytics**: 
    -   Generate transaction, event-wise, and student-wise reports
    -   Export to CSV and PDF formats
    -   Visual statistics and collection progress tracking
-   **Print Distribution**: 
    -   Dedicated interface for tracking physical material distribution.
    -   QR code scanning support for quick distribution.
    -   Real-time stock and distribution status monitoring.
-   **Settings**: 
    -   Manage UPI payment QR codes with auto-validation.
    -   **Student Portal Link**: Set a unique slug for your workspace's public check-status URL and copy/share it with students.
    -   **Multi-Admin**: Superusers can create and manage multiple admin accounts.

### 🎨 UI/UX Design
-   **Glassmorphism**: A unified, translucent frosted-glass aesthetic across the entire app.
-   **Dark Mode**: A sleek, emerald-themed dark interface with animated background orbs.
-   **Smooth Animations**: Fluid transitions, micro-interactions, and custom cursor effects.
-   **Mobile First**: Fully responsive design optimized for screens as small as 353px width.
- [x] **Unified Authentication**: Seamlessly switch between login, signup, and forgot password on a single dynamic page.
- [x] **Premium Communication**: Branded email templates with the "Classroom OS" aesthetic for all transactional emails.
- [x] **Custom Components**: Branded loaders, glass cards, and interactive elements.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Prisma ORM](https://www.prisma.io/))
-   **Authentication**: Custom session-based auth with bcrypt
-   **Payment Integration**: Razorpay
-   **PDF Generation**: jsPDF with autoTable
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Utilities**: `clsx`, `tailwind-merge`, `date-fns`

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
-   Node.js 18+ installed
-   PostgreSQL database (local or cloud like Neon/Supabase)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/FundEd-SKSBANK/fundEd-Web.git
    cd fundEd-Web
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add the following:
    ```env
    # Database Connection
    DATABASE_URL="postgresql://user:password@localhost:5432/funded_db"

    # Authentication
    NEXTAUTH_SECRET="your-secret-key-here"
    NEXTAUTH_URL="http://localhost:9002"
    
    # App Config
    NEXT_PUBLIC_APP_URL="http://localhost:9002"
    
    # Razorpay (Optional - for payment integration)
    RAZORPAY_KEY_ID="your-razorpay-key-id"
    RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

4.  **Setup Database**
    Push the Prisma schema to your database:
    ```bash
    npx prisma db push
    ```
    
    Generate Prisma Client:
    ```bash
    npx prisma generate
    ```

5.  **Create Admin User**
    Run the seed script to create an initial admin user:
    ```bash
    npm run seed
    ```
    Default credentials: `admin@funded.com` / `admin123`

6.  **Run the Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:9002](http://localhost:9002) to view the application.

## 📂 Project Structure

```bash
fundEd-Web/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── src/
│   ├── actions/            # Server Actions (Data mutations)
│   ├── ai/                 # AI Flows & GenKit Config
│   │   ├── flows/          # AI/Logic Flows
│   │   ├── dev.ts          # GenKit Dev Server
│   │   └── genkit.ts       # GenKit Initialization
│   ├── app/                # Next.js App Router pages
│   │   ├── check-status/   # Public Student Portal
│   │   ├── dashboard/      # Admin Protected Area
│   │   │   ├── events/     # Event management
│   │   │   ├── prints/     # Print distribution
│   │   │   ├── reports/    # Reports & analytics
│   │   │   ├── settings/   # Settings & config
│   │   │   ├── students/   # Student management
│   │   │   ├── page.tsx    # Dashboard home
│   │   │   └── *.utils.ts  # Utility functions per page
│   │   ├── login/          # Admin login
│   │   ├── pay/            # Student payment portal
│   │   └── page.tsx        # Landing page
│   ├── components/         # Reusable UI Components
│   │   ├── ui/             # Shadcn Primitives
│   │   ├── branded-loader.tsx
│   │   ├── custom-cursor.tsx
│   │   ├── glass-card.tsx
│   │   ├── mouse-follower.tsx
│   │   └── ...
│   └── lib/                # Utilities & Types
│       ├── auth.ts         # Authentication utilities
│       ├── db.ts           # Prisma client
│       ├── types.ts        # TypeScript types
│       └── utils.ts        # Helper functions
└── package.json
```

## 🎯 Recent Updates

### Unified Auth & Premium Communication (v1.5.0)
- ✅ **Unified Auth Page**: Merged Login, Signup, and Forgot Password into a single, high-performance dynamic page.
- ✅ **Compact Design**: Forms optimized for single-glance visibility on mobile screens with no scrolling required.
- ✅ **Superadmin Notifications**: Added notification system for superadmins to monitor new user registrations in real-time.
- ✅ **Premium Email Branding**: Re-styled all outgoing emails (Reset Password, Event Invitations, Receipts) with GraduationCap logo and Classroom OS branding.
- ✅ **Port Standardization**: Unified local development fallback port to `9002` across all server actions.

### Admin Workspace Isolation & Student Portal (v1.4.0)
- ✅ Each admin workspace now gets a **unique public check-status URL** (`/check-status/[slug]`)
- ✅ Student search results are **fully scoped** to the admin's workspace — no cross-tenant data leakage
- ✅ New **Student Portal Link** card in Settings: set your slug, preview URL, and copy link button
- ✅ `slug` field added to `User` model with uniqueness constraint
- ✅ Removed global check-status link from landing page nav and footer
- ✅ Old `/check-status` now shows an informational page directing students to their institution's link

### Print Distribution Deletion (v1.3.0)
- ✅ Admins can now delete incorrect print distributions
- ✅ Delete confirmation dialog prevents accidental removals
- ✅ Fixed page refresh glitch on event selection in print page

### Expense Quick Access (v1.2.0)
- ✅ Collapsible Expenses section in the sidebar with direct event links
- ✅ Dashboard card showing active events with direct links to expense pages

### Mobile Responsive Improvements (v1.1.0)
- ✅ Fixed homepage navigation button overflow on 353px screens
- ✅ Optimized dashboard header for mobile (compact icons, reduced padding)
- ✅ Fixed stats cards overflow with proper width constraints
- ✅ Made reports transaction table horizontally scrollable on mobile
- ✅ All pages now properly fit on screens as small as 353px width

### Code Organization (v1.0.5)
- ✅ Separated utility functions into dedicated `.utils.ts` files for each dashboard page
- ✅ Improved code maintainability and reusability
- ✅ Reduced code duplication across components

## 🔐 Authentication

The application uses custom session-based authentication:
- Admin users can log in at `/login`
- Sessions are stored securely with httpOnly cookies
- Passwords are hashed using bcrypt
- Protected routes automatically redirect to login

## 📊 Database Schema

The application uses the following main models:
- **User**: Admin users with authentication and unique public `slug` for student portal URL
- **Student**: Student records with roll number, class, and `createdById` for workspace isolation
- **Event**: Fund collection events with deadlines, costs, and payment options
- **Payment**: Transaction records with multiple payment methods and verification workflow
- **Expense**: Event-linked expense tracking with bill upload and category support
- **PrintDistribution**: Track physical print distribution to students per event
- **QrCode**: Manage UPI payment QR codes for events

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🏢 About

**FundEd** is a sub-product of **SKS DM** (Classroom OS), designed to bring transparency and efficiency to student fund management in educational institutions.

---

Made with ❤️ by the FundEd Team
