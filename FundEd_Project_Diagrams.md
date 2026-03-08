# FundEd-Web: Project Diagrams

This document presents a comprehensive set of diagrams illustrating the architecture, data flow, and user interactions of the FundEd-Web application.

---

## 1. Activity Diagram
This diagram outlines the primary workflows for both Administrators and Students.

```mermaid
graph TD
    Start((Start)) --> Landing[Landing Page]
    Landing --> Auth{User Role?}
    
    %% Admin Flow
    Auth -- Admin --> AdminLogin[Portal Login]
    AdminLogin --> Dashboard[Dashboard]
    AdminActions{Manage...}
    Dashboard --> AdminActions
    
    AdminActions -- Students --> StuMgmt[Register/Upload Students]
    AdminActions -- Events --> EvMgmt[Create/Edit Events]
    EvMgmt --> PrintCheck{Is Print Event?}
    PrintCheck -- Yes --> PrintFlow[Generate QR/Print List]
    PrintFlow --> Distribute[Mark Distributed]
    
    AdminActions -- Payments --> PayVer[Verify Manual/QR Payments]
    AdminActions -- Expenses --> ExpMgmt[Record/Track Expenses]
    
    StuMgmt --> Reports[Generate PDF Reports]
    PayVer --> Reports
    ExpMgmt --> Reports
    
    %% Student Flow
    Auth -- Student --> StuChoice{Action?}
    
    StuChoice -- Check Status --> StatusPage[Public Slug URL]
    StatusPage --> Identity[Enter Roll No & Class]
    Identity --> ViewStatus[View Payment/Entry Status]
    ViewStatus --> Receipt[Download Receipt if Paid]
    
    StuChoice -- Make Payment --> EventSel[Select Event]
    EventSel --> PayMethod{Method?}
    PayMethod -- Razorpay --> RPay[Automatic API Payment]
    PayMethod -- QR/Cash --> ManualPay[Upload Screenshot/Submit Cash]
    RPay --> Confirmation[Payment Confirmed]
    ManualPay --> Pending[Wait for Admin Verification]
    Confirmation --> Receipt
    
    Reports --> End((End))
    Receipt --> End
```

---

## 2. Entity Relationship (ER) Diagram
*Chen Notation Style: Entities in Rectangles, Attributes in Ellipses.*

```mermaid
graph TD
    %% Entities
    User[User]
    Student[Student]
    Event[Event]
    Payment[Payment]
    Expense[Expense]

    %% User Attributes
    User --- U1([id])
    User --- U2([email])
    User --- U3([name])
    User --- U4([slug])

    %% Student Attributes
    Student --- ST1([id])
    Student --- ST2([rollNo])
    Student --- ST3([class])

    %% Event Attributes
    Event --- E1([id])
    Event --- E2([name])
    Event --- E3([cost])

    %% Payment Attributes
    Payment --- P1([id])
    Payment --- P2([amount])
    Payment --- P3([status])

    %% Relationships with Cardinalities
    User -- "1" --- R1{manages} --- ST_N["N"] --- Student
    User -- "1" --- R2{manages} --- EV_N["N"] --- Event
    Student -- "1" --- R3{makes} --- P_N["N"] --- Payment
    Event -- "1" --- R4{collects} --- PY_N["N"] --- Payment
    Event -- "1" --- R5{incurs} --- EX_N["N"] --- Expense
```

---

## 3. Data Flow Diagram (Level 0: Context Diagram)

```mermaid
graph TD
    S((Student))
    A((Admin))
    SU((Superuser))
    RP((Razorpay API))
    ES((Email Service))
    
    P((FundEd Management System))
    
    S -- "Search (Roll No/Name)" --> P
    P -- "Payment Status & History" --> S
    S -- "Initiate Payment" --> P
    
    A -- "Manage Students/Events" --> P
    A -- "Verify Payments" --> P
    P -- "Financial Reports" --> A
    
    SU -- "Manage Admins" --> P
    P -- "System Analytics" --> SU
    
    P -- "Payment Details" --> RP
    RP -- "Transaction Confirmation" --> P
    
    P -- "Receipt Data" --> ES
    ES -- "Success Email" --> S
```

---

## 4. Data Flow Diagram (Level 1: Functional Decomposition)

```mermaid
graph TD
    %% Entities (Circles)
    Student((Student))
    Admin((Admin))
    Superuser((Superuser))
    Razorpay((Razorpay API))
    
    %% Processes (Circles)
    P1((1.0 Auth & Access Control))
    P2((2.0 Student Service))
    P3((3.0 Management Service))
    P4((4.0 Payment Processing))
    P5((5.0 Reporting Engine))
    P6((6.0 Print Distribution))

    %% Level 1 Flows
    Admin -- "Login Credentials" --> P1
    Superuser -- "Admin Config" --> P1
    
    Student -- "Status Query" --> P2
    P2 -- "Show Status" --> Student
    
    Admin -- "Manage Data" --> P3
    
    Student -- "Make Payment" --> P4
    P4 -- "Verify Order" --> Razorpay
    Razorpay -- "Confirmation" --> P4
    Admin -- "Manual Verify" --> P4
    
    Admin -- "Request Analysis" --> P5
    P5 -- "PDF/CSV Reports" --> Admin
    
    Admin -- "Distribute Item" --> P6
```

---

## 5. Data Flow Diagram (Level 2: Detailed Data Flow)

```mermaid
graph TD
    %% Processes (Circles)
    P1((1.0 Auth Control))
    P2((2.0 Student Service))
    P3((3.0 Management Service))
    P4((4.0 Payment Proc))
    P5((5.0 Reports))
    P6((6.0 Print Dist))

    %% Data Stores (Database shape)
    D1[(D1: User Store)]
    D2[(D2: Student Store)]
    D3[(D3: Event Store)]
    D4[(D4: Payment Store)]
    D5[(D5: Expense Store)]

    %% Data Flows
    P1 <--> D1
    P2 -- "Fetch Info" --> D2
    P2 -- "Fetch History" --> D4
    P3 -- "CRUD Students" --> D2
    P3 -- "CRUD Events" --> D3
    P3 -- "Log Expenses" --> D5
    P4 -- "Update Status" --> D4
    P5 -- "Aggregated Data" --> D4
    P5 -- "Aggregated Data" --> D5
    P6 -- "Update Inventory" --> D3
    P6 -- "Log Distribution" --> D2
```

---

## 6. Use Case Diagram
*Detailed mapping with professional Actors and System Boundary.*

```mermaid
graph LR
    %% Actors
    subgraph Actors
        S((Student))
        A((Admin))
        SU((Superuser))
    end

    %% System Boundary
    subgraph FundEd_System ["FundEd Management System"]
        UC1(Search & Check Status)
        UC2(Initiate Payment)
        UC3(Download / Print Receipt)
        UC10(View Payment History)
        
        UC4(Admin Login / Register)
        UC5(Manage Students)
        UC6(Manage Events)
        UC_Print(Print Distribution)
        UC_Exp(Track Expenses & Funds)
        
        UC9(Manage Admin Access)
        UC11(View Data Analytics)
    end

    %% Student Relationships
    S --> UC1
    S --> UC10
    S --> UC2
    UC1 -.-> UC10
    UC2 -.-> UC3
    
    %% Admin Relationships
    A --> UC4
    A --> UC5
    A --> UC6
    A --> UC_Print
    
    %% Connections as child/extension
    UC6 --- UC_Exp
    
    %% Superuser Relationships
    SU --> UC9
    SU --> UC11
```

---

## 7. Global Sequence Diagram
*Comprehensive end-to-end site flow covering Students and Admins.*

```mermaid
sequenceDiagram
    actor S as Student
    actor A as Admin
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant R as Razorpay

    Note over S, D: Student Browsing & Payment Flow
    S->>F: Access Landing Page
    F->>S: Render Features & "Check Status"
    S->>F: Enter Roll No & Class
    F->>B: GET /api/student/status
    B->>D: Query Student & Payments
    D-->>B: Data Result
    B-->>F: Return Status Payload
    F->>S: Show History & "Pay Now"
    S->>F: Click "Pay Now"
    F->>R: Initiate Razorpay Order
    R-->>F: Order ID
    F->>S: Open Checkout Modal
    S->>R: Complete Payment
    R-->>F: Payment success_id
    F->>B: POST /api/payment/verify
    B->>D: Update Payment Store
    D-->>B: Success
    B-->>F: Confirmation
    F->>S: Provide Digital Receipt

    Note over A, D: Admin Management Flow
    A->>F: Login to Admin Portal
    F->>B: POST /api/auth/login
    B->>D: Validate Admin Credentials
    D-->>B: User Record
    B-->>F: Session Token
    A->>F: Go to "Events" -> "Manage"
    F->>A: Show Event Dashboard
    A->>F: Log Event Expense
    F->>B: POST /api/expense/log
    B->>D: Insert Expense Row
    A->>F: Mark Print Distributed
    F->>B: PATCH /api/distribution/mark
    B->>D: Update Student-Event Record
```

---

## 8. System Architecture
*Detailed Component & Feature Architecture.*

```mermaid
graph TB
    subgraph ClientLayer [Client Layer - Next.js]
        LP[Landing Page]
        SP[Student Portal]
        AD[Admin Dashboard]
        UI[UI Components]
    end

    subgraph FeatureLayer [Feature Components]
        Auth[Authentication]
        Pay[Razorpay Integration]
        Email[Email Service]
        Repo[Reporting Engine]
        Print[Print Logic]
    end

    subgraph ServerLayer [Server Layer - Next.js]
        SA[Server Actions]
        API[API Routes]
        Val[Zod Validation]
    end

    subgraph DataLayer [Data Layer]
        ORM[Prisma ORM]
        DB[(PostgreSQL)]
        IMG[Cloudinary Store]
    end

    %% Interactions
    LP --> UI
    SP --> UI
    AD --> UI
    UI <--> Auth
    AD --> Print
    AD --> Repo
    SP --> Pay
    Pay --> SA
    Repo --> SA
    Print --> SA
    Auth --> SA
    SA --> Val
    API --> Val
    Val --> ORM
    ORM <--> DB
    SA --> Email
    AD --> IMG
```
