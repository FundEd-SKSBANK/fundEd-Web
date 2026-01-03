# FundEd - Student Payment & Event Management System

FundEd is a modern, full-stack web application designed to streamline event payment tracking and student management for educational institutions. It features a premium, glassmorphism-inspired UI with comprehensive mobile responsiveness and a robust admin dashboard for managing transactions, students, and events.

![FundEd Banner](/public/funded-icon.png)    

## ✨ Key Features

### 🎓 Student Portal
-   **Public Status Check**: Students can verify their payment status instantly using their Name or Roll Number at `/check-status`.
-   **Payment Ledger**: Detailed view of paid, due, and verified transactions.
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
-   **Print Distribution**: Track and manage print distribution for events.
-   **Settings**: Manage QR codes and admin users.

### 🎨 UI/UX Design
-   **Glassmorphism**: A unified, translucent frosted-glass aesthetic across the entire app.
-   **Dark Mode**: A sleek, emerald-themed dark interface with animated background orbs.
-   **Smooth Animations**: Fluid transitions, micro-interactions, and custom cursor effects.
-   **Mobile First**: Fully responsive design optimized for screens as small as 353px width.
-   **Custom Components**: Branded loaders, glass cards, and interactive elements.

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
    ```

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
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   ├── payments.ts
│   │   ├── reports.ts
│   │   ├── students.ts
│   │   └── ...
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

### Mobile Responsive Improvements (v1.1.0)
- ✅ Fixed homepage navigation button overflow on 353px screens
- ✅ Optimized dashboard header for mobile (compact icons, reduced padding)
- ✅ Fixed stats cards overflow with proper width constraints
- ✅ Made reports transaction table horizontally scrollable on mobile
- ✅ Added responsive text sizes throughout the application
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
- **User**: Admin users with authentication
- **Student**: Student records with roll number and class
- **Event**: Fund collection events with deadlines and costs
- **Payment**: Transaction records with multiple payment methods
- **PrintDistribution**: Track print distribution to students
- **QrCode**: Manage QR codes for payments

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
