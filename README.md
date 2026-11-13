# Gavel Club USJ Website

Official website for the Gavel Club of University of Sri Jayewardenepura.

## About

The Gavel Club of the University of Sri Jayewardenepura operates under the Career Guidance Unit (CGU) and is a dynamic community dedicated to developing public speaking and leadership skills through regular meetings, workshops, and events.

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **shadcn/ui** - UI component library

## Features

- Responsive design with mobile-first approach
- Smooth scroll animations
- Executive committee showcase
- Events and achievements galleries
- Podcast integration with YouTube
- Contact information and social media links
- Table Topics voter at `/vote` with PIN-based ballots, live admin results, and manual vote entry

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm installed

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

### Environment variables

Copy `.env.example` to `.env` and fill in the values. The Table Topics voter needs `MONGODB_URI`; the admin area uses `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET`.

### Table Topics voter

- Public voting: [http://localhost:3000/vote](http://localhost:3000/vote) (ballot at [http://localhost:3000/vote/ballot](http://localhost:3000/vote/ballot))
- Admin console: [http://localhost:3000/admin/vote](http://localhost:3000/admin/vote) (uses the existing website admin session)

## Project Structure

```
gavel-usj/
├── app/                # Next.js app directory
├── components/         # React components
│   ├── ui/            # UI components (shadcn)
│   └── *-section.tsx  # Page sections
├── public/            # Static assets
│   ├── events/       # Event images
│   ├── achievements/ # Achievement images
│   ├── memories/     # Memory photos
│   ├── exco/         # Executive committee photos
│   └── about-us/     # About section assets
└── lib/              # Utility functions
```

## Credits

**Developed by:** Dinil Hansara  
**Position:** Webmaster, Gavel Club of USJ 2025/26 Executive Committee

---

© 2026 Gavel Club of University of Sri Jayewardenepura. All rights reserved.
