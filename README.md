# AUST Student Helpdesk

A modern student support platform designed for the **African University of Science and Technology (AUST), Abuja, Nigeria**.

The AUST Student Helpdesk provides a centralized platform for students to submit complaints, report facility issues, request items, book venues, and track the progress of their submissions.

**Live Demo:** [Open AUST Student Helpdesk](https://0c1d0791.aust-student-helpdesk.pages.dev)

**Repository:** [GitHub — aust-student-helpdesk](https://github.com/joshuakimia1008-beep/aust-student-helpdesk)

---

## Overview

University students need a straightforward way to report problems and communicate with the teams responsible for resolving them.

The AUST Student Helpdesk addresses this need through a web-based platform that organizes student submissions, provides reference numbers, supports administrative workflows, and enables students to follow up on their requests.

The project combines a responsive Vue.js frontend with a Supabase backend for authentication, database operations, file storage integration, and server-side functionality.

## Features

### Student Portal

- **Complaint submission:** Submit complaints and report issues requiring attention.
- **Facility and item requests:** Report faulty facilities and request items such as fans or air-conditioning units.
- **Venue booking:** Submit requests to book university venues.
- **Reference numbers:** Receive a unique reference number for submitted requests.
- **Request tracking:** Access personal submissions and follow their progress.
- **Student authentication:** Register, verify email addresses, and sign in.
- **Profile and dashboard:** Access the student portal and manage relevant account information.
- **Email notifications:** Support for submission receipts and request status notifications.

### Administrative Dashboard

- **Request management:** Review and manage student submissions.
- **Role-based access:** Separate administrative responsibilities according to assigned roles.
- **Complaint administration:** Handle complaints and facility or item requests.
- **Venue administration:** Manage venue booking requests.
- **Read-only access:** Provide designated administrators with viewing access.
- **Administrative overview:** Access relevant information about submissions and their status.
- **Activity and notification interfaces:** Support administrative monitoring and communication.

### User Experience

- Responsive layouts for different screen sizes.
- Dedicated authentication and student portal interfaces.
- Campus hostel information and image galleries.
- Light and dark theme support in administrative interfaces.
- Clear request statuses and feedback messages.

## Technology Stack

| Technology | Purpose |
|---|---|
| Vue 3 | Reactive frontend application |
| TypeScript | Type-safe application development |
| Vite | Development server and production build tooling |
| Tailwind CSS v4 | Utility-first styling |
| Vue Router | Client-side navigation |
| Supabase | Authentication, database and backend services |
| PostgreSQL | Relational database |
| Supabase Edge Functions | Server-side workflows and email integrations |
| Resend | Transactional email delivery |
| Cloudflare Pages | Frontend hosting |
| Playwright | End-to-end testing |

## Architecture

The application follows a frontend-and-backend architecture.

```text
Student / Administrator
          |
          v
   Vue 3 Frontend
          |
          v
    Supabase Client
          |
          v
  Supabase Services
   ├── Authentication
   ├── PostgreSQL Database
   ├── Row Level Security
   ├── Storage Integration
   └── Edge Functions
          |
          v
   Email Notifications
```

The frontend communicates with Supabase for supported application operations. Database access policies and server-side authorization are important parts of protecting student submissions and administrative functionality.

## Getting Started

### Prerequisites

Before running the project locally, install:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- A [Supabase](https://supabase.com/) project for backend functionality

Git is recommended for version control.

### 1. Clone the repository

```bash
git clone https://github.com/joshuakimia1008-beep/aust-student-helpdesk.git
```

Navigate into the project:

```bash
cd aust-student-helpdesk
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file from the provided template.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and configure the required frontend variables:

```env
VITE_BACKEND_MODE=supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Replace the placeholder values with the appropriate credentials for your own Supabase project.

**Security:** Never put a Supabase service-role key, secret API key, database password, or Resend API key in frontend environment variables prefixed with `VITE_`. Keep server-side secrets in the appropriate Supabase Edge Function secrets configuration.

### 4. Configure the Supabase backend

The repository includes SQL migrations in:

```text
supabase/migrations/
```

Review the migrations and apply them to your development Supabase project in the correct order using your chosen Supabase migration workflow.

Configure authentication settings, email verification, required storage resources, and any backend secrets needed by the Edge Functions.

Do not apply these migrations blindly to an existing production database. Review their effects and back up important data before making database changes.

### 5. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal, typically:

```text
http://localhost:5173
```

### 6. Build for production

Run the TypeScript checks and production build:

```bash
npm run build
```

Vite generates the production frontend assets in the `dist/` directory.

## Project Structure

```text
aust-student-helpdesk/
├── public/
│   ├── images/
│   └── videos/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── admin/
│   │   └── site/
│   ├── lib/
│   ├── views/
│   │   └── admin/
│   ├── App.vue
│   ├── main.ts
│   ├── router.ts
│   └── style.css
├── supabase/
│   ├── functions/
│   └── migrations/
├── tests/
│   └── e2e/
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Security Considerations

Security is particularly important for a student support platform that may handle personal information and evidence submitted with complaints.

- Keep private credentials out of source control.
- Use Row Level Security (RLS) to restrict database access.
- Ensure students can access only their own submissions.
- Enforce administrative permissions on the backend, not just in the frontend.
- Keep service-role keys and other privileged secrets in server-side environments.
- Restrict access to uploaded evidence and other private files.
- Configure authentication redirect URLs for trusted application origins.
- Avoid committing real student records, passwords, tokens, or private attachments.

Database migrations are included to make the database structure and policy changes reviewable alongside the application code.

## Testing

The repository includes Playwright end-to-end test configuration and tests.

Run the configured test suite using the appropriate script from `package.json`. For example, if the project defines a `test:e2e` script:

```bash
npm run test:e2e
```

Ensure the required test environment and browser dependencies are configured before running the tests.

## Deployment

The frontend is hosted on Cloudflare Pages.

**Live application:** [AUST Student Helpdesk](https://0c1d0791.aust-student-helpdesk.pages.dev)

For production deployments, configure the correct environment variables and ensure Supabase authentication redirects and allowed origins match the deployed domain.

## Contributing

Contributions, suggestions, bug reports, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run the relevant checks.
5. Submit a pull request describing your changes.

Please do not submit real credentials, private student information, or production database secrets.

## Project Status

The application has been deployed and continues to be developed and improved. Some workflows and integrations may require further testing or configuration depending on the deployment environment.

## Acknowledgements

Built to explore practical applications of web development, backend integration, database design, authentication, access control, and digital student support.

## License

No license has been specified yet. Unless a license is added to this repository, others should not assume they have permission to reuse, modify, or redistribute the code.

