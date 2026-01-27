# Deployment Guide: Vercel + Neon DB

This guide walks you through deploying your Exercise Counter app to Vercel with Neon DB as your PostgreSQL database.

## Prerequisites

- ✅ Neon DB account (free tier)
- ✅ Vercel account (free tier)
- ✅ GitHub account (for connecting to Vercel)

---

## Part 1: Set Up Neon DB

### Step 1: Create a New Project in Neon

1. Go to [console.neon.tech](https://console.neon.tech) and sign in
2. Click **"Create Project"** or **"New Project"**
3. Fill in the details:
   - **Project Name**: `exercise-counter` (or any name you prefer)
   - **Region**: Choose the closest region to your users (e.g., `us-east-1`)
   - **PostgreSQL Version**: Use the default (usually 15 or 16)
   - **Compute Size**: Free tier (0.5 vCPU, 0.5 GB RAM)
4. Click **"Create Project"**

### Step 2: Get Your Connection String

1. Once your project is created, you'll see the **Connection Details** panel
2. Look for the **Connection String** - it will look like:
   ```
   postgresql://username:password@ep-xxxx-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. **Copy this connection string** - you'll need it in the next steps
4. ⚠️ **Important**: Neon uses connection pooling. For serverless environments like Vercel, you should use the **pooled connection string**:
   - Look for a tab or option that says **"Pooled connection"** or **"Serverless"**
   - Use that connection string instead (it usually has `-pooler` in the hostname)

### Step 3: Run Database Migrations

1. Update your local `.env` file with the Neon connection string:
   ```env
   DATABASE_URL="your-neon-connection-string-here"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-here"
   ```

2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```

3. Generate Prisma Client:
   ```bash
   npm run db:generate
   ```

4. Push your schema to Neon DB:
   ```bash
   npm run db:push
   ```
   
   This will create all your tables (User, Exercise, Goal, Account, Session, VerificationToken) in Neon.

5. (Optional) Seed the database with test data:
   ```bash
   npm run db:seed
   ```

### Step 4: Verify Database Connection

You can verify everything works by running:
```bash
npm run db:studio
```

This opens Prisma Studio where you can see your database tables.

---

## Part 2: Deploy to Vercel

### Step 1: Push Your Code to GitHub

1. Make sure your code is committed:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   ```

2. Push to GitHub (if you haven't already):
   ```bash
   git push origin main
   ```

### Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository:
   - If you see your repo, click **"Import"**
   - If not, click **"Adjust GitHub App Permissions"** and grant access to your repo
4. Select your `exercise-counter` repository

### Step 3: Configure Vercel Project Settings

1. **Project Name**: Keep default or change it
2. **Framework Preset**: Should auto-detect as "Next.js"
3. **Root Directory**: Leave as `./` (root)
4. **Build Command**: Should be `npm run build` (auto-detected)
5. **Output Directory**: Leave as `.next` (auto-detected)
6. **Install Command**: Should be `npm install` (auto-detected)

### Step 4: Add Environment Variables

**Before clicking "Deploy"**, add these environment variables:

1. Click **"Environment Variables"** section
2. Add each variable:

   **Variable 1:**
   - **Name**: `DATABASE_URL`
   - **Value**: Your Neon DB connection string (use the **pooled** connection string)
   - **Environments**: Select all (Production, Preview, Development)

   **Variable 2:**
   - **Name**: `NEXTAUTH_URL`
   - **Value**: `https://your-project-name.vercel.app` (replace with your actual Vercel URL - you can update this after first deploy)
   - **Environments**: Select all

   **Variable 3:**
   - **Name**: `NEXTAUTH_SECRET`
   - **Value**: Generate a new secret:
     ```bash
     openssl rand -base64 32
     ```
     Copy the output and paste it as the value
   - **Environments**: Select all

3. Click **"Deploy"**

### Step 5: Wait for Deployment

- Vercel will install dependencies, build your app, and deploy it
- This usually takes 2-5 minutes
- You'll see build logs in real-time

### Step 6: Update NEXTAUTH_URL (After First Deploy)

1. Once deployment completes, Vercel will show your app URL (e.g., `https://exercise-counter-abc123.vercel.app`)
2. Go to **Settings** → **Environment Variables**
3. Update `NEXTAUTH_URL` to your actual Vercel URL
4. Click **"Save"**
5. Go to **Deployments** tab → Click the three dots on the latest deployment → **"Redeploy"**

---

## Part 3: Post-Deployment Setup

### Step 1: Run Migrations on Production Database

Your local `db:push` created tables, but if you want to use migrations instead:

1. Set your `DATABASE_URL` environment variable locally to point to Neon:
   ```bash
   export DATABASE_URL="your-neon-connection-string"
   ```

2. Run migrations:
   ```bash
   npm run db:migrate
   ```

   Or if you prefer to push schema:
   ```bash
   npm run db:push
   ```

### Step 2: Test Your Deployed App

1. Visit your Vercel URL
2. Test signup/login
3. Test the exercise counter
4. Verify data is being saved (check Neon DB console or use Prisma Studio)

### Step 3: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Update `NEXTAUTH_URL` environment variable to your custom domain
4. Redeploy

---

## Troubleshooting

### Database Connection Issues

- **Error: "Connection refused"**
  - Make sure you're using the **pooled connection string** (not the direct connection)
  - Check that your Neon project is active (not paused)

- **Error: "SSL required"**
  - Neon requires SSL. Make sure your connection string includes `?sslmode=require`
  - The pooled connection string should already include this

### Authentication Issues

- **Error: "Invalid NEXTAUTH_SECRET"**
  - Generate a new secret: `openssl rand -base64 32`
  - Update it in Vercel environment variables
  - Redeploy

- **Error: "Invalid NEXTAUTH_URL"**
  - Make sure `NEXTAUTH_URL` matches your actual Vercel deployment URL
  - Include `https://` prefix
  - No trailing slash

### Build Errors

- **Error: "Module not found"**
  - Make sure `pg` is in your `package.json` dependencies (not just devDependencies)
  - Run `npm install` locally and commit `package-lock.json`

- **Error: "Prisma Client not generated"**
  - Add a build script in `package.json`:
    ```json
    "scripts": {
      "build": "prisma generate && next build"
    }
    ```
  - Or add `postinstall` script:
    ```json
    "scripts": {
      "postinstall": "prisma generate"
    }
    ```

---

## Quick Reference: Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon DB pooled connection string | `postgresql://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_URL` | Your Vercel app URL | `https://exercise-counter.vercel.app` |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | Generated with `openssl rand -base64 32` |

---

## Next Steps

- ✅ Monitor your app in Vercel dashboard
- ✅ Check Neon DB usage in Neon console
- ✅ Set up Vercel Analytics (optional)
- ✅ Configure automatic deployments from GitHub (already enabled by default)

---

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Neon DB Documentation](https://neon.tech/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)