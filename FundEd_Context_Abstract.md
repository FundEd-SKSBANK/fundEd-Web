# FundEd - Context & Abstract
**Subtitle**: Student Payment & Event Management System
**Context**: A core module of SKS DM (Classroom OS)

## 1. Core Purpose
FundEd is a modern, full-stack web application designed to streamline event payment tracking, expense logging, and student management for educational institutions. It replaces manual, error-prone fee collection with a transparent, digitized system that handles everything from initiating student payments to verifying manual transactions and tracking the physical distribution of event materials.

## 2. User Roles & Workflows
The application is designed around three primary user tiers:
* **Students (End Users):** Students do not need to log in. They traverse a unique, workspace-scoped public URL (`/check-status/[slug]`) provided by their institution. By searching their Name or Roll Number, they can view their payment ledgers (paid vs. pending), download receipts, and initiate new payments for events using automated methods (Razorpay) or manual methods (uploading QR screenshots or paying cash).
* **Admins (Institution Managers):** Admins operate within isolated workspaces. They use a secure dashboard to manage student records (including CSV bulk uploads), create events with specific costs and deadlines, track expenses incurred during events, verify manual student payments, and generate detailed PDF/CSV financial reports. They also manage the physical distribution of event materials (like printed tickets or merchandise) using QR scanning capabilities.
* **Superusers (Platform Owners):** Responsible for the overarching platform management, allowing them to create, monitor, and configure multiple Admin accounts.

## 3. Key System Features
* **Payment Processing Engine:** Supports multiple robust payment methods including automatic Razorpay integration and manual workflows (Cash, QR Code screenshot uploads) that require Admin verification.
* **Tenant Isolation (Workspace Scoping):** Each Admin's data is strictly isolated. Students interacting with an Admin's unique `slug` URL can only query search results and process transactions specifically for that Admin's events and dataset.
* **Print & Inventory Distribution:** A dedicated sub-system for Admins to track when physical items for an event have been successfully distributed to specific students, preventing double-dipping.
* **Premium UI/UX:** Features a highly responsive, mobile-first design with a Glassmorphism-inspired dark mode aesthetic and fluid micro-animations.

## 4. Technical Architecture & Data Model
* **Frameworks:** Built on **Next.js 15 (App Router)** utilizing **TypeScript**.
* **Backend & Data Layer:** Relies on Next.js Server Actions and API Routes, interfaced with a **PostgreSQL** database via **Prisma ORM**.
* **Core Entities:** 
    * `User` (Admin accounts)
    * `Student` (Belongs to an Admin's workspace)
    * `Event` (Created by Admins, targets Students)
    * `Payment` (Transactions linking a Student to an Event)
    * `Expense` (Costs incurred against an Event)
    * `PrintDistribution` (Fulfillment tracking per Event/Student)
* **External Integrations:** Includes **Razorpay** for payment gateway services and an **Email Service** for automated receipt and notification delivery.
