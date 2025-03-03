# Getting Started with Fitbook

## Introduction

Welcome to Fitbook! This guide will help you set up your development environment and understand the basic workflow of the project.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18.x or later)
   ```bash
   # Check Node.js version
   node --version
   ```

2. **PostgreSQL** (v14.x or later)
   ```bash
   # Check PostgreSQL version
   psql --version
   ```

3. **Git**
   ```bash
   # Check Git version
   git --version
   ```

4. **VS Code** (recommended)
   - Install recommended extensions:
     - ESLint
     - Prettier
     - Tailwind CSS IntelliSense
     - Prisma
     - GitLens

## Initial Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/fitbook.git
   cd fitbook
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy example environment file
   cp .env.example .env.local

   # Update the following variables in .env.local:
   DATABASE_URL=postgresql://username:password@localhost:5432/fitbook
   NEXTAUTH_SECRET=your-secret-key
   CLOUDINARY_URL=your-cloudinary-url
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Create database tables
   npx prisma db push

   # Seed initial data (optional)
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

```
fitbook/
├── app/                    # Next.js App Router directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── catalog/           # Wardrobe catalog pages
│   ├── outfits/           # Outfit management pages
│   ├── lookbooks/         # Lookbook pages
│   ├── profile/           # User profile pages
│   └── components/        # Shared React components
├── lib/                   # Utility functions and shared logic
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## Key Concepts

### 1. Authentication
- Uses NextAuth.js for authentication
- Google OAuth integration
- Protected routes and API endpoints
- Session management

### 2. Database
- PostgreSQL with Prisma ORM
- Complex relationships between entities
- Automated migrations
- Type-safe queries

### 3. Image Processing
- Cloudinary integration
- Automatic color extraction
- Image optimization
- Multiple formats support

### 4. State Management
- React hooks for local state
- Context for global state
- Server state management
- Form state handling

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push changes
git push origin feature/your-feature-name
```

### 2. Database Changes
```bash
# Create migration
npx prisma migrate dev --name your-migration-name

# Apply migration
npx prisma migrate deploy

# Update client
npx prisma generate
```

### 3. Testing
```bash
# Run all tests
npm test

# Run specific test
npm test -- path/to/test

# Update snapshots
npm test -- -u
```

### 4. Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Common Tasks

### Creating a New Page
1. Create page file in appropriate directory
2. Add route handler if needed
3. Implement page component
4. Add tests

Example:
```typescript
// app/feature/page.tsx
export default function FeaturePage() {
  return (
    <div>
      <h1>Feature Page</h1>
      {/* Page content */}
    </div>
  )
}
```

### Adding an API Endpoint
1. Create route file in api directory
2. Implement request handlers
3. Add validation
4. Add tests

Example:
```typescript
// app/api/feature/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Implementation
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Error message' }, { status: 500 })
  }
}
```

### Creating a New Component
1. Create component file
2. Add TypeScript types
3. Implement component
4. Add tests

Example:
```typescript
// app/components/Feature.tsx
interface FeatureProps {
  title: string
  children: React.ReactNode
}

export default function Feature({ title, children }: FeatureProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  )
}
```

## Debugging

### Server-Side
1. Use `console.log` or debugger
2. Check API route logs
3. Monitor database queries
4. Check authentication flow

### Client-Side
1. Use React Developer Tools
2. Check browser console
3. Monitor network requests
4. Use component debugging

## Deployment

### Development
- Automatic deployment on push
- Preview environments
- Database migrations
- Environment variables

### Production
1. Build application
   ```bash
   npm run build
   ```

2. Start production server
   ```bash
   npm start
   ```

3. Monitor deployment
   - Check logs
   - Monitor performance
   - Track errors

## Common Issues

### 1. Database Connection
```bash
# Check database status
npx prisma db push

# Reset database
npx prisma migrate reset
```

### 2. Authentication
- Check environment variables
- Verify OAuth configuration
- Clear browser cookies
- Check session status

### 3. Image Upload
- Verify Cloudinary configuration
- Check file size limits
- Monitor upload progress
- Handle errors properly

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

### Tools
- [Prisma Studio](https://www.prisma.io/studio)
- [Cloudinary Console](https://cloudinary.com/console)
- [Next.js DevTools](https://nextjs.org/docs/advanced-features/debugging)

### Community
- GitHub Issues
- Discord Channel
- Stack Overflow
- Team Chat

## Next Steps

1. Review [Architecture Overview](../technical/architecture.md)
2. Explore [Feature Documentation](../features/README.md)
3. Check [API Documentation](../technical/api.md)
4. Read [Development Guidelines](./development.md) 