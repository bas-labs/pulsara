# Al Fallo 🏃⚡

Sports event discovery & registration platform for Mexico. Built with React + TypeScript + Vite + Tailwind CSS + shadcn/ui + AWS Amplify Gen 2.

## Features

### For Athletes (Atletas)
- Browse events by sport, city, date
- Register for events with distance selection
- View race results (times, ranks, pace)
- Track personal stats (events, distance, podiums)
- PLUS subscription for premium features

### For Organizers (Organizadores)
- Create and manage events
- Set multiple distances with pricing
- View and manage registrations
- Publish/unpublish events
- Upload results post-event

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animation | Framer Motion |
| Icons | Lucide React |
| Auth | AWS Cognito (2 groups: organizadores, atletas) |
| API | AWS AppSync (GraphQL) via Amplify Data |
| Database | DynamoDB (8 tables, 16+ GSIs) |
| Storage | S3 (event images, avatars, race photos) |
| Hosting | AWS Amplify Hosting |

## Getting Started

### Prerequisites
- Node.js 18+
- AWS account
- Amplify CLI: `npm install -g @aws-amplify/backend-cli`

### Setup

```bash
# Clone
git clone https://github.com/bas-labs/alfallo.git
cd alfallo

# Install deps
npm install

# Start Amplify sandbox (creates cloud resources)
npx ampx sandbox

# In another terminal, start dev server
npm run dev

# Seed database with events
npx tsx scripts/seed.ts
```

### Deploy to Production

```bash
# Connect to Amplify Hosting in AWS Console:
# 1. Go to AWS Amplify Console
# 2. "Host web app" → Connect to GitHub → select bas-labs/alfallo
# 3. Amplify auto-detects the build settings
# 4. Deploy

# Or via CLI:
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

## Data Models

- **UserProfile** — Athletes & organizers with stats + PLUS subscription
- **Event** — Sports events with location, dates, pricing, status
- **EventDistance** — Distance options per event (10K, 21K, etc.)
- **Registration** — User ↔ Event registrations with payment status
- **Result** — Race results with chip time, ranks, pace
- **Serial** — Race series (multi-event competitions)
- **Order** — Payment records (Stripe integration ready)
- **Article** — Blog content by category

## Project Structure

```
alfallo/
├── amplify/
│   ├── auth/resource.ts          # Cognito config
│   ├── data/resource.ts          # 8 data models + GSIs
│   ├── storage/resource.ts       # S3 buckets
│   └── backend.ts                # Entry point
├── src/
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   └── Layout.tsx            # Nav + role-aware routing
│   ├── context/
│   │   └── AuthContext.tsx        # Auth state + group detection
│   ├── pages/
│   │   ├── Landing.tsx           # Public landing page
│   │   ├── Onboarding.tsx        # Role selection + profile
│   │   ├── EventBrowser.tsx      # Event search + filters
│   │   ├── EventDetail.tsx       # Event info + registration
│   │   ├── atleta/
│   │   │   ├── Dashboard.tsx     # Athlete stats + upcoming
│   │   │   ├── MyEvents.tsx      # Registration history
│   │   │   └── Results.tsx       # Race results
│   │   └── organizador/
│   │       ├── Dashboard.tsx     # Org stats + event list
│   │       ├── CreateEvent.tsx   # Event creation form
│   │       └── ManageEvent.tsx   # Registrations + publish
│   ├── App.tsx                   # Routes + lazy loading
│   └── main.tsx                  # Amplify config + entry
├── infra/
│   ├── dynamodb-schema.md        # Full schema documentation
│   ├── create-tables.sh          # Standalone DynamoDB creation
│   └── seed-events.json          # 25 scraped events
├── scripts/
│   └── seed.ts                   # Database seeder
└── public/
    └── images/                   # DALL-E generated images
```

## License

MIT
