# DecaByte — Full Specification (Consolidated)

## Project Overview



## Technical Foundations (Constitution)

### Language Policy
- Primary language: **English**.
- Must support internationalization (i18n) for adding languages later without major refactoring.

### State Management
- **Riverpod** is the official state management solution, chosen for:
  - Async support (streams/futures, ideal for Firebase)
  - Testability (easy mocking/isolation)
  - Reliability (compile-time safety)
- All business logic and UI state must be managed via Riverpod providers.

### Backend Architecture
- Backend relies entirely on **Firebase**:
  - Firestore
  - Firebase Authentication
  - Cloud Storage
  - Cloud Functions (if needed)

### Offline-First Strategy
- Must support offline and online modes.
- Offline: app continues working, data stored locally.
- On reconnect: automatic synchronization of local data with cloud backend.
- Offline-first architecture is prioritized throughout.

---

## Authentication

### Overview
Users securely access DecaByte via Firebase authentication, supporting multiple login methods with a simple, fast experience.

### Authentication Methods
1. **Google Account Authentication** — via Firebase Google Authentication.
2. **Phone Number + Password** — registration via phone number and password, with SMS OTP verification during account creation.

### Session Management
- Sessions are maintained automatically; valid sessions skip re-login.
- **Remember Me** option available at login.

### Quick Unlock
After first successful login, user can enable quick unlock:
1. **PIN Code** — 4-digit PIN.
2. **Biometric Authentication** — fingerprint via device's native biometric APIs.
- User can enable one or both.

### First-Time Setup
- After first login, user is prompted to configure a 4-digit PIN and optional biometrics.
- Occurs only once unless settings are reset.

### Authentication Flow
- Initial: Splash Screen → Login/Signup → Authentication → First Setup (PIN/Biometrics) → Dashboard.
- Returning: Splash Screen → Quick Unlock (PIN or Fingerprint) → Dashboard.

### Security Requirements
- Passwords stored securely via Firebase authentication mechanisms.
- No sensitive data stored in plain text.
- Biometric authentication relies on native device security.

### Firebase Integration
- Firebase Authentication, Google Sign-In Provider, Phone Authentication, secure session management.
- All authentication state changes synchronized with Firebase.

---

## Clients Management

### Overview
Manage all clients associated with freelance work: create, edit, delete. Supports **Quick Mode** and **Advanced Mode**.

### Core Features
- Create client, edit client, delete client, view client list, view client details.

### Client Creation Modes
- **Quick Mode**: only requires Client Name — for fast entry.
- **Advanced Mode**: Client Name (required), Phone Number, Email Address, Social Media Links, Address, Notes (all optional except name).

### Client Data Structure
`id, name, phone, email, social_links, address, notes, created_at, updated_at`

### Client List Screen
- Displays client name, optional phone/email, quick action menu (edit/delete).
- Tapping opens client profile.

### Client Details Screen
- Sections: basic information, contact information, social links, notes.
- Future modules (projects, payments) may reference the client.

### Client Editing
- Users can update any client information at any time (reuses creation form layout).

### Client Deletion
- Requires confirmation dialog before deletion.

### Firebase Integration
- Stored in Firebase Firestore, `clients` collection.
- Offline-first synchronization supported.

---

## Project Management

### Overview
Manage freelance projects associated with clients via a step-based creation flow. Supports create, edit, view, delete.

### Project Creation Flow

**Step 1 — Basic Information**
- Project Name (required)
- Project Description (optional)
- Project Category (required, predefined but extendable)

**Step 2 — Client & Pricing**
- Client (required)
- Project Price (DZD)
- If client doesn't exist, user can quick-add a client (name only) directly from this screen.

**Step 3 — Project Tasks (Optional)**
- Optional tasks/sub-steps (e.g., Mobile App Development, Presentation, Demo Video).
- Projects may contain no tasks, one task, or multiple tasks.

**Step 4 — Project Status & Timeline**
- Project Status: Planned, In Progress, Waiting Client, Completed, Cancelled.
- Project Progress Percentage (optional)
- Start Date (optional)
- End Date / Deadline (optional)

### Project Data Structure
`id, name, description, category, client_id, price_dzd, status, progress_percentage, start_date, end_date, created_at, updated_at`

### Tasks Data Structure (Optional)
`id, project_id, name, status, created_at`

### Firebase Integration
- Stored in Firebase Firestore: `projects`, `project_tasks` collections.
- Projects reference client via `client_id`.
- Offline-first synchronization supported.

---

## Payments

### Overview
Record and track payments received from clients for specific projects. Each payment must be associated with a project; the client is derived from the project. Tracks whether a project is fully paid, partially paid, or paid beyond the agreed amount.

### Payment Association
- Each payment links to a **Project**; the **Client** is automatically derived from the project.

### Payment Amount Logic
- **Full Payment**: payment amount equals project price.
- **Partial Payment**: payment amount less than project price; remaining amount tracked as pending. Multiple partial payments supported.
- **Extra Payment (Tip/Bonus)**: payment amount exceeds agreed price; extra recorded as tip/bonus, original project price unchanged.

### Payment Creation
- Required: Project, Payment Amount (DZD)
- Optional: Payment Method, Payment Notes, Payment Date

### Payment Method (Optional/Advanced)
- Possible methods: CCP Transfer, Cash, Other. Can be hidden under advanced input mode.

### Payment Data Structure
`id, project_id, client_id, amount, payment_type (full/partial/tip), payment_method, notes, payment_date, created_at`

### Payment Tracking
- Per project: agreed project price, total received payments, remaining amount.

### Firebase Integration
- Stored in Firebase Firestore, `payments` collection.
- Each payment references `project_id` and `client_id`.
- Offline-first synchronization supported.

---

## Expenses

### Overview
Record and track expenses related to freelance work, helping calculate project profitability. Expenses may be linked to a specific project or recorded as general business expenses.

### Expense Association
1. **Project Expense** — linked to a specific project.
2. **General Expense** — not linked to any project (general business cost).
- Project field is optional.

### Expense Creation
- Required: Expense Amount (DZD)
- Optional: Project, Expense Category, Description/Notes, Expense Date

### Expense Categories
- Examples: Software/Tools, Hosting/Services, Equipment, Transportation, Marketing, Other.
- Categories should be extendable in the future.

### Expense Data Structure
`id, amount, project_id (optional), category, description, expense_date, created_at, updated_at`

### Expense Tracking
- View total expenses, expenses per project, general expenses not linked to a project.

### Firebase Integration
- Stored in Firebase Firestore, `expenses` collection.
- Offline-first synchronization supported.

---

## Contracts

### Overview
Generate project contracts for clients, including: user's standard info (fixed, set once in Settings), client-specific info, project details, payment schedule, and terms/policies/legal clauses. Contracts should be editable before final issuance.

### Contract Creation Flow

**Step 1 — Client Information**
- Client Name (required); Phone, Email, Address (optional)

**Step 2 — Project Information**
- Project Name/Thing to Develop, Project Type, Short Description (required)

**Step 3 — Contract Terms**
- Contract Duration (start/end dates)
- Agreed Price (DZD)
- Payment Method (Cash, CCP, Vamo, etc.)
- Payment Schedule: Initial Payment, Subsequent Payments, Number of Payments, automatic splitting of total price across payments

**Step 4 — Standard Clauses (Fixed)**
- Confidentiality/Non-disclosure, Source Code Delivery upon completion, Intellectual Property rights, other standard policies.
- These clauses are pre-defined and stored in the Settings module.

### Contract Data Structure
`id, client_id, project_id, client_info (name, phone, email, address), project_info (name, type, description), start_date, end_date, total_price, payment_method, payment_schedule (initial + subsequent payments), standard_clauses, custom_notes, created_at, updated_at`

### PDF / Export
- Contracts must be exportable as PDF, including all required client, project, payment, and terms information.
- Optionally include digital signature placeholders.

### Firebase Integration
- Stored in Firebase Firestore.
- Each contract references `client_id` and `project_id`.
- Offline-first synchronization supported.

---

## Invoices (Proforma & Final)

### Overview
DecaByte supports two invoice types:
1. **Proforma Invoice** — propose a price before starting work.
2. **Final Invoice** — issued after contract agreement or work underway.
- Both link to Projects and optionally Contracts.

### Proforma Invoice (Price Quote)
Purpose: show price proposal and payment terms before starting work.

Fields:
- Client Info (Name required; phone/email/address optional)
- Project Info (Name, Type, Short Description)
- Proposed Total Amount
- Payment Method (Cash, CCP, Vamo, etc.)
- Payment Schedule: Initial Payment (Down Payment), Number of Payments (optional)
- Notes/Remarks (optional)

Behavior:
- Does not mark any payment as received.
- Exportable as PDF for client approval.
- Serves as a base for Final Invoice creation.

### Final Invoice
Purpose: official invoice for received payments or completed work.

Fields:
- Client Info, Project Info, Contract Reference (optional)
- Total Amount
- Payment Details: Paid Amount, Pending Amount, Payment Method(s), Payment Schedule
- Notes/Remarks (optional)

Behavior:
- Reflects actual payments recorded in Payments module.
- Exportable as PDF or sent digitally.
- Supports linking to Contract terms.

### Invoice Data Structure
`id, invoice_type (proforma/final), client_id, project_id, contract_id (optional), invoice_date, due_date (optional), total_amount, paid_amount (final only), pending_amount (final only), payment_method, payment_schedule (initial + subsequent payments), line_items (optional), notes, created_at, updated_at`

### Firebase Integration
- Stored in Firebase Firestore.
- References: `client_id`, `project_id`, `contract_id` (optional).
- Offline-first synchronization supported.

---

## Calendar

### Overview
Manage work-related events, track project deadlines, and organize meetings/reminders. Integrates with projects and supports synchronization with Google Calendar. Automatically displays project deadlines alongside manual events.

### Core Features
- View, create, edit, delete events; link events to projects; automatically display project deadlines; sync with Google Calendar.

### Calendar Views
- Month View (default), Week View, Day View.

### Event Creation
- Required: Event Title, Event Date
- Optional: Event Time, Linked Project, Description/Notes, Reminder, Location
- Events may exist independently or be linked to a project.

### Project Deadline Integration
- If a project has an End Date/Due Date, a calendar event is automatically created (e.g., "Mobile App Development — Deadline").
- **Automatic Updates**: if project deadline changes, the calendar event updates automatically; if project is deleted, the related event is removed.
- Auto-generated events contain: Event Title, Event Date, Linked Project ID, Event Type: `project_deadline`.

### Event Types
- Manual Event, Project Deadline (visually distinguishable).

### Reminders
- Options: 10 minutes before, 1 hour before, 1 day before.
- Trigger local device notifications.

### Google Calendar Synchronization
- Import events from Google Calendar; export DecaByte events to Google Calendar; synchronize project deadline events.
- Requires connecting Google account.

### Offline Behavior
- Supports offline-first architecture: events stored locally when offline; synchronization occurs automatically once connectivity is restored.

### Event Data Structure
`id, title, description, date, time, project_id (optional), reminder, location, event_type, source (local/google), created_at, updated_at`

---

## Dashboard

### Overview
Central hub giving a complete overview of projects, clients, payments, expenses, contracts, and invoices, with KPIs, quick actions, recent activities, and upcoming deadlines.

### Sections

**1. Performance**
- Metrics for This Month and This Year: Revenue, Expenses, Active Projects, Net Incoming, Unpaid Projects, Profit Overview (Revenue - Expenses).
- Metrics update in real-time based on Projects, Payments, and Expenses.
- Profit Overview widget color: Green = profit, Red = loss.

**2. Quick Actions**
- Add Project, Add Client, Add Payment, Add Advance, Add Contract, Add Expense.
- Opens respective creation form in modal or new page; pre-fills common fields when possible (e.g., last client selected).

**3. Recently Activity**
- Shows latest actions: Created Projects, Added Payments, Added Expenses, Created Contracts/Invoices.
- Filter by type; shows timestamp; scrollable list, latest first.

**4. Upcoming Deadlines**
- Shows projects with upcoming end dates/milestones: Project Name, Days Remaining, Linked Client.
- Auto-updates from Projects module; tap to view details.

**5. Graphical Overview**
- Line/bar chart: Revenue vs Expenses over months.
- Pie chart: Projects by status (Planned, In Progress, Waiting Client, Completed).

**6. Top Clients / Projects**
- Optional: Top Clients by Revenue, Top Projects by Revenue. Clickable, updates dynamically.

**7. Alerts / Notifications**
- Highlights: Overdue payments, upcoming deadlines (<3 days), late projects.
- Visual cues (colored badges/icons); option to navigate directly to relevant record.

### Data Sources
- Projects: id, name, status, start_date, end_date, client_id, total_price
- Payments: id, project_id, amount, payment_date, payment_status
- Expenses: id, project_id (optional), amount, category
- Contracts: id, client_id, project_id, total_price, payment_schedule
- Invoices: id, invoice_type, client_id, project_id, total_amount, paid_amount

### Firebase Integration
- Reads from Firestore collections: `projects`, `payments`, `expenses`, `contracts`, `invoices`.
- Offline-first synchronization supported; real-time updates for metrics and widgets.

### Notes
- Quick Actions should accelerate common freelancer workflows.
- Performance metrics should clearly distinguish revenue, expenses, and profit.
- Graphical Overview optional for MVP but recommended.
- Alerts ensure critical deadlines/payments aren't missed.

---

## Settings

### Overview
Customize and manage the DecaByte application experience: account settings, application preferences, security options, and integrations.

### Core Features

**1. Account Settings**
- Manage account info (display name, email)
- Change password (if applicable)
- Link/unlink Google account

**2. Application Preferences**
- Choose app language (default English, future languages)
- Enable/disable dark mode
- Set default project categories (optional)

**3. Security Settings**
- Enable/disable PIN unlock
- Enable/disable fingerprint unlock
- Change PIN code
- Session management (logout all devices, remember me option)

**4. Integrations**
- Google Calendar sync settings
- Firebase notifications toggle
- Export/backup data (future feature)

**5. Notifications**
- Enable/disable push notifications
- Notification preferences for: Project deadlines, Payment reminders, Task updates

**6. About & Support**
- Version information
- Contact support (email/link)
- Terms of service & privacy policy

### Data & Storage
- User preferences stored locally (offline-first).
- Firebase may store account-related preferences for cross-device sync.
- Security-sensitive data (PIN, biometric preference) must use secure storage.

### Recommended Sections
1. Account
2. Preferences
3. Security
4. Integrations
5. Notifications
6. About & Support

### Additional Notes
- Settings changes apply immediately without requiring app restart.
- Sensitive actions (e.g., logout, change PIN) require confirmation dialog.
- Advanced features (e.g., export data) can be hidden under "Advanced Settings".
