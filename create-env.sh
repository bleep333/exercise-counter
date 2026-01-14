#!/bin/bash

# Script to create .env file with placeholders

echo "Creating .env file..."

cat > .env << 'EOF'
# Database Configuration
# Replace the placeholders with your actual PostgreSQL credentials
# Format: postgresql://username:password@host:port/database_name?schema=public
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/exercise_counter?schema=public"

# NextAuth Configuration
# Replace with your app URL (use http://localhost:3000 for development)
NEXTAUTH_URL="http://localhost:3000"

# NextAuth Secret
# This is a randomly generated secret - you can regenerate with: openssl rand -base64 32
# IMPORTANT: Generate a new secret for production!
NEXTAUTH_SECRET="REMOVED="
EOF

echo ".env file created successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env and replace YOUR_PASSWORD_HERE with your PostgreSQL password"
echo "2. If you created a dedicated user, update the username in DATABASE_URL"
echo "3. Run: npm run db:generate"
echo "4. Run: npm run db:migrate"
