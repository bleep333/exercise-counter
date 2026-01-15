# Exercise Counter

A real-time exercise tracking web application using MediaPipe pose estimation. Track your workouts, view statistics, and compete on the leaderboard!

## Features

- **Real-time pose detection** using MediaPipe
- **Automatic exercise counting** based on arm angle detection (pushups currently supported)
- **User authentication** with NextAuth.js (email/password)
- **Exercise statistics** - track all your workouts with timestamps
- **Leaderboard** - compete with others (today/past 30 days)
- **Profile names** - set a public profile name for the leaderboard
- **Guest mode** - try the app without signing up (data stored locally)
- **Session tracking** - save workout sessions with duration and rep counts
- **Responsive design** - works on mobile and desktop

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Prisma** - ORM
- **NextAuth.js** - Authentication
- **Tailwind CSS** - Styling
- **MediaPipe** - Pose estimation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Webcam/camera

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd exercise-counter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/exercise_counter"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with dummy user (optional)
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Getting Started

1. **Sign up** or **Sign in** (or use as guest)
2. Navigate to **Counter** to select an exercise
3. Click on **Pushups** to start the camera counter
4. Click **Start Session** to begin tracking
5. Do your pushups - the counter tracks automatically
6. Click **Stop** when done, then **Save Session** to save your workout

### Account Settings

- Go to **Account** (in the navigation bar when logged in)
- Set your **Profile Name** to appear on the leaderboard
- Profile names must be unique and 3-30 characters

### Viewing Stats

- Go to **Stats** to see all your completed workouts
- View date, time, exercise type, count, and duration
- Guest users can migrate their data after signing up

### Leaderboard

- Go to **Leaderboard** to see top performers
- Filter by **Today** or **Past 30 Days**
- Only users with profile names are shown
- Rankings show total pushups completed in the selected period

## How It Works

The application uses MediaPipe's pose estimation to detect key body landmarks (shoulders, elbows, wrists). It calculates the angle of your elbow joint and uses a state machine to track when you go down and come back up:

- **DOWN state**: When your elbow angle goes below 90°
- **UP state**: When your elbow angle goes above 160°
- A pushup is counted when you transition from DOWN → UP

The counter uses smoothing and timing constraints to prevent false counts from jittery movements.

## Database Schema

- **User** - User accounts with authentication
- **Exercise** - Workout sessions with type, count, duration, and timestamp
- **Account/Session** - NextAuth.js authentication tables

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with dummy data
- `npm run db:studio` - Open Prisma Studio

## Tips for Best Results

1. **Camera position**: Place the camera to capture your side profile
2. **Lighting**: Ensure good lighting so the camera can see your body clearly
3. **Background**: Use a contrasting background (avoid similar colors to your body)
4. **Distance**: Stay at a reasonable distance so your full upper body is visible
5. **Form**: Maintain proper pushup form for accurate detection

## Troubleshooting

- **Camera not opening**: Make sure to allow camera access in your browser settings
- **MediaPipe not loading**: Check your internet connection (MediaPipe loads from CDN)
- **Not detecting pushups**: Adjust lighting, check camera angle, ensure side profile is visible
- **Database connection errors**: Verify your `DATABASE_URL` in `.env` is correct
- **Authentication issues**: Make sure `NEXTAUTH_SECRET` is set in `.env`

## Project Structure

```
exercise-counter/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Landing page
│   ├── counter/             # Exercise selection page
│   ├── pushup_counter/      # Pushup counter page
│   ├── stats/               # Statistics page
│   ├── leaderboard/         # Leaderboard page
│   ├── account/             # Account settings page
│   ├── auth/                # Authentication pages
│   └── api/                 # API routes
├── components/              # React components
│   ├── NavBar.tsx          # Navigation bar
│   └── PoseCounter.tsx     # Main counter component
├── lib/                     # Utility functions
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # Auth helpers
│   └── guest.ts            # Guest data management
├── prisma/                  # Prisma files
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seed script
├── package.json            # Dependencies
└── README.md               # This file
```

## Dummy User

The seed script creates a test user:
- Email: `user@counter.com`
- Password: `user123`
- Profile Name: `FitnessPro`

## License

MIT License
